# ML offline (P8)

Camada **opcional** de treinamento Python. A aplicação Next.js **nunca** invoca estes scripts em runtime — ela usa scoring determinístico (`features/scoring/recalculate.ts`) por padrão.

## O que faz

- `train_repurchase.py` treina uma **Logistic Regression** simples para propensão de recompra.
- Entrada: CSV de histórico de compras ou dados sintéticos gerados no script.
- Saída: `ml/output/customer_scores.json` e `.csv` importáveis para `customer_scores`.
- Split **por tempo**: features calculadas em cutoff `2025-01-01`; label = recompra nos 90 dias seguintes.

## Pré-requisitos

- Python 3.10+ (3.9 pode funcionar)
- pip

## Executar localmente

```bash
cd ml
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Com CSV de exemplo do repositório
python train_repurchase.py --input data/sample_purchases.csv

# Ou sem CSV (gera histórico sintético alinhado aos IDs demo)
python train_repurchase.py
```

Saídas em `ml/output/`:

| Arquivo | Uso |
|---------|-----|
| `customer_scores.json` | Import via `import-ml-scores.ts` |
| `customer_scores.csv` | Inspeção manual / BI |

## Formato de entrada (export CSV)

Colunas esperadas:

```csv
organization_id,customer_id,order_date,revenue_cents
org-demo-industrial,customer-demo-aco-forte,2024-03-15,2450000
```

- `order_date`: ISO (`YYYY-MM-DD` ou datetime UTC)
- `revenue_cents`: inteiro
- `organization_id`: opcional (default `org-demo-industrial`)

Exporte pedidos confirmados/entregues do Turso ou use `ml/data/sample_purchases.csv`.

## Importar scores no banco

Requer `TURSO_DATABASE_URL` (e token se aplicável), com seed/migrations já aplicados:

```bash
# Após treinar
npx tsx db/seed/import-ml-scores.ts ml/output/customer_scores.json

# Ou usar o sample commitado (sem Python)
npx tsx db/seed/import-ml-scores.ts ml/output/sample_customer_scores.json
```

O script:

- valida o JSON (Zod);
- insere apenas clientes existentes na organização;
- substitui scores **somente** dos clientes presentes no arquivo.

A app **funciona normalmente sem este import** — insights/dashboard usam recálculo determinístico até você importar scores ML.

## Limitações (importante)

1. **Demonstração, não produção** — modelo simples em dados sintéticos ou export parcial.
2. **Não roda na Vercel** — treinamento é 100% offline; deploy não inclui Python.
3. **Next.js nunca chama Python** — não há API route, cron ou Server Action que execute `ml/`.
4. **Recálculo sobrescreve** — usar “Recalcular scores” na UI repõe a camada determinística e remove scores ML importados para os clientes recalculados.
5. **Métricas ilustrativas** — com poucos clientes demo, holdout pode ter classe única; o script registra aviso e segue exportando scores.
6. **Explicabilidade limitada** — `explanations` inclui probabilidade e features brutas, não SHAP/LIME.

## Estrutura

```
ml/
├── README.md
├── requirements.txt
├── train_repurchase.py
├── data/
│   └── sample_purchases.csv
└── output/
    ├── sample_customer_scores.json   # importável sem treinar
    └── customer_scores.json          # gerado localmente (gitignored)
```
