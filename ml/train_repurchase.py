#!/usr/bin/env python3
"""
Offline repurchase propensity training for SalesOps Industrial Demo.

Trains a simple scikit-learn model on purchase history (CSV export format or
synthetic data), evaluates with a time-based split, and exports JSON/CSV for
db/seed/import-ml-scores.ts.

This script is NEVER invoked by the Next.js application at runtime.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DEFAULT_ORG_ID = "org-demo-industrial"
DEMO_CUSTOMER_IDS = [
    "customer-demo-aco-forte",
    "customer-demo-alimentos-serra",
    "customer-demo-autopecas-brasil",
    "customer-demo-embalagens-sul",
    "customer-demo-mineracao-horizonte",
    "customer-demo-quimica-vale",
]
PRIORITY_WEIGHTS = {"repurchase": 0.4, "inactivity": 0.35, "potential": 0.25}
REPURCHASE_WINDOW_DAYS = 90
FEATURE_CUTOFF = pd.Timestamp("2025-01-01", tz="UTC")


def clamp_score(value: float) -> int:
    return int(round(min(100, max(0, value))))


def compute_priority_score(
    repurchase: float, inactivity: float, potential: float
) -> int:
    total = (
        repurchase * PRIORITY_WEIGHTS["repurchase"]
        + inactivity * PRIORITY_WEIGHTS["inactivity"]
        + potential * PRIORITY_WEIGHTS["potential"]
    )
    return clamp_score(total)


def generate_synthetic_purchases(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows: list[dict[str, object]] = []
    start = pd.Timestamp("2023-01-01", tz="UTC")
    end = pd.Timestamp("2025-08-01", tz="UTC")

    for customer_id in DEMO_CUSTOMER_IDS:
        purchase_count = int(rng.integers(3, 10))
        dates = pd.to_datetime(
            rng.choice(
                pd.date_range(start, end, freq="D"),
                size=purchase_count,
                replace=False,
            )
        ).sort_values()

        for order_date in dates:
            revenue = int(rng.integers(350_000, 5_500_000))
            rows.append(
                {
                    "organization_id": DEFAULT_ORG_ID,
                    "customer_id": customer_id,
                    "order_date": order_date,
                    "revenue_cents": revenue,
                }
            )

    return pd.DataFrame(rows)


def load_purchases(path: Path | None) -> pd.DataFrame:
    if path is None:
        print("No --input provided; generating synthetic purchase history.")
        return generate_synthetic_purchases()

    frame = pd.read_csv(path)
    required = {"customer_id", "order_date", "revenue_cents"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {sorted(missing)}")

    if "organization_id" not in frame.columns:
        frame["organization_id"] = DEFAULT_ORG_ID

    frame["order_date"] = pd.to_datetime(frame["order_date"], utc=True)
    return frame


def build_training_rows(purchases: pd.DataFrame) -> pd.DataFrame:
    """One row per customer with features at cutoff and label from future window."""
    rows: list[dict[str, object]] = []

    for customer_id, group in purchases.groupby("customer_id"):
        org_id = group["organization_id"].iloc[0]
        history = group.sort_values("order_date")
        before = history[history["order_date"] < FEATURE_CUTOFF]
        after = history[
            (history["order_date"] >= FEATURE_CUTOFF)
            & (
                history["order_date"]
                < FEATURE_CUTOFF + pd.Timedelta(days=REPURCHASE_WINDOW_DAYS)
            )
        ]

        if before.empty:
            continue

        last_purchase = before["order_date"].max()
        days_since_last = (FEATURE_CUTOFF - last_purchase).days
        purchase_count = len(before)
        revenue_total = int(before["revenue_cents"].sum())
        avg_interval = (
            before["order_date"].diff().dt.days.dropna().mean()
            if purchase_count > 1
            else 120.0
        )
        repurchased = int(len(after) > 0)

        rows.append(
            {
                "organization_id": org_id,
                "customer_id": customer_id,
                "days_since_last_purchase": days_since_last,
                "purchase_count": purchase_count,
                "revenue_total_cents": revenue_total,
                "avg_interval_days": avg_interval if not np.isnan(avg_interval) else 120.0,
                "repurchased_within_window": repurchased,
            }
        )

    return pd.DataFrame(rows)


def build_scoring_features(purchases: pd.DataFrame, as_of: pd.Timestamp) -> pd.DataFrame:
    rows: list[dict[str, object]] = []

    for customer_id, group in purchases.groupby("customer_id"):
        org_id = group["organization_id"].iloc[0]
        history = group[group["order_date"] <= as_of].sort_values("order_date")

        if history.empty:
            continue

        last_purchase = history["order_date"].max()
        days_since_last = max(0, (as_of - last_purchase).days)
        purchase_count = len(history)
        revenue_total = int(history["revenue_cents"].sum())
        avg_interval = (
            history["order_date"].diff().dt.days.dropna().mean()
            if purchase_count > 1
            else 120.0
        )

        rows.append(
            {
                "organization_id": org_id,
                "customer_id": customer_id,
                "days_since_last_purchase": days_since_last,
                "purchase_count": purchase_count,
                "revenue_total_cents": revenue_total,
                "avg_interval_days": avg_interval if not np.isnan(avg_interval) else 120.0,
            }
        )

    return pd.DataFrame(rows)


FEATURE_COLUMNS = [
    "days_since_last_purchase",
    "purchase_count",
    "revenue_total_cents",
    "avg_interval_days",
]


def heuristic_repurchase_probability(row: pd.Series) -> float:
    recency = max(0.0, 1.0 - row["days_since_last_purchase"] / 180)
    frequency = min(1.0, row["purchase_count"] / 10)
    interval_factor = max(0.0, 1.0 - abs(row["avg_interval_days"] - 90) / 180)
    return min(1.0, 0.5 * recency + 0.3 * frequency + 0.2 * interval_factor)


def train_model(
    training: pd.DataFrame,
) -> tuple[Pipeline | None, dict[str, float | str | None], str]:
    metrics: dict[str, float | str | None] = {
        "split": "time_based_feature_cutoff",
        "feature_cutoff": FEATURE_CUTOFF.isoformat(),
        "repurchase_window_days": REPURCHASE_WINDOW_DAYS,
        "train_rows": 0,
        "test_rows": 0,
        "accuracy": None,
        "roc_auc": None,
    }

    if training.empty:
        print("Warning: no training rows; using heuristic fallback.")
        metrics["mode"] = "heuristic_fallback"
        return None, metrics, "heuristic"

    X = training[FEATURE_COLUMNS]
    y = training["repurchased_within_window"]

    sorted_training = training.sort_values("days_since_last_purchase")
    split_at = max(1, int(len(sorted_training) * 0.7))
    if split_at >= len(sorted_training) and len(sorted_training) > 1:
        split_at = len(sorted_training) - 1

    train_idx = sorted_training.index[:split_at]
    test_idx = sorted_training.index[split_at:]

    X_train, X_test = X.loc[train_idx], X.loc[test_idx]
    y_train, y_test = y.loc[train_idx], y.loc[test_idx]
    metrics["train_rows"] = int(len(X_train))
    metrics["test_rows"] = int(len(X_test))

    if y_train.nunique() < 2:
        print(
            "Warning: training labels have a single class; "
            "using heuristic fallback for scoring export."
        )
        metrics["mode"] = "heuristic_fallback"
        return None, metrics, "heuristic"

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "model",
                LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    metrics["mode"] = "logistic_regression"

    if len(X_test) > 0 and y_test.nunique() > 1:
        probabilities = pipeline.predict_proba(X_test)[:, 1]
        predictions = (probabilities >= 0.5).astype(int)
        metrics["accuracy"] = float(accuracy_score(y_test, predictions))
        metrics["roc_auc"] = float(roc_auc_score(y_test, probabilities))
        print("\nClassification report (time-based holdout):")
        print(classification_report(y_test, predictions, digits=3))
        print(f"ROC-AUC: {metrics['roc_auc']:.3f}")
    else:
        print("\nSkipped holdout metrics (not enough test rows or single class).")

    return pipeline, metrics, "logistic_regression"


def score_customers(
    pipeline: Pipeline | None,
    features: pd.DataFrame,
    calculated_at: datetime,
    mode: str,
) -> list[dict[str, object]]:
    if features.empty:
        return []

    if pipeline is None or mode == "heuristic":
        probabilities = features.apply(heuristic_repurchase_probability, axis=1).to_numpy()
        model_name = "heuristic_fallback"
    else:
        probabilities = pipeline.predict_proba(features[FEATURE_COLUMNS])[:, 1]
        model_name = "logistic_regression"
    max_revenue = max(features["revenue_total_cents"].max(), 1)
    max_purchases = max(features["purchase_count"].max(), 1)

    scores: list[dict[str, object]] = []
    for i, (_, row) in enumerate(features.iterrows()):
        repurchase_prob = float(probabilities[i])
        repurchase_score = clamp_score(repurchase_prob * 100)
        inactivity_score = clamp_score(
            (row["days_since_last_purchase"] / 180) * 100
        )
        potential_score = clamp_score(
            0.6 * (row["revenue_total_cents"] / max_revenue) * 100
            + 0.4 * (row["purchase_count"] / max_purchases) * 100
        )
        priority_score = compute_priority_score(
            repurchase_score, inactivity_score, potential_score
        )

        scores.append(
            {
                "customerId": row["customer_id"],
                "repurchaseScore": repurchase_score,
                "inactivityRiskScore": inactivity_score,
                "potentialScore": potential_score,
                "priorityScore": priority_score,
                "explanations": {
                    "source": "ml_offline",
                    "model": model_name,
                    "repurchaseProbability": round(repurchase_prob, 4),
                    "features": {
                        "daysSinceLastPurchase": int(row["days_since_last_purchase"]),
                        "purchaseCount": int(row["purchase_count"]),
                        "revenueTotalCents": int(row["revenue_total_cents"]),
                        "avgIntervalDays": round(float(row["avg_interval_days"]), 2),
                    },
                    "limitations": [
                        "Demonstration model trained on synthetic or exported CSV data.",
                        "Not validated for production decisions.",
                    ],
                },
            }
        )

    return scores


def export_outputs(
    output_dir: Path,
    organization_id: str,
    calculated_at: datetime,
    metrics: dict[str, float | str | None],
    scores: list[dict[str, object]],
    mode: str,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "version": 1,
        "organizationId": organization_id,
        "calculatedAt": calculated_at.isoformat(),
        "model": {
            "name": mode,
            "metrics": metrics,
        },
        "scores": scores,
    }

    json_path = output_dir / "customer_scores.json"
    csv_path = output_dir / "customer_scores.csv"

    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    pd.DataFrame(scores).to_csv(csv_path, index=False)

    print(f"\nExported {len(scores)} score rows:")
    print(f"  JSON: {json_path}")
    print(f"  CSV:  {csv_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        help="Purchase history CSV (organization_id,customer_id,order_date,revenue_cents).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
        help="Directory for customer_scores.json and customer_scores.csv.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    purchases = load_purchases(args.input)
    training = build_training_rows(purchases)

    print(f"Loaded {len(purchases)} purchase rows for {purchases['customer_id'].nunique()} customers.")
    print(f"Training rows at cutoff {FEATURE_CUTOFF.date()}: {len(training)}")

    pipeline, metrics, mode = train_model(training)

    as_of = pd.Timestamp(datetime.now(timezone.utc))
    scoring_features = build_scoring_features(purchases, as_of)
    calculated_at = datetime.now(timezone.utc)
    organization_id = (
        str(purchases["organization_id"].iloc[0])
        if not purchases.empty
        else DEFAULT_ORG_ID
    )

    scores = score_customers(pipeline, scoring_features, calculated_at, mode)
    export_outputs(
        args.output_dir,
        organization_id,
        calculated_at,
        metrics,
        scores,
        mode,
    )

    print("\nImport with:")
    print("  npx tsx db/seed/import-ml-scores.ts ml/output/customer_scores.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
