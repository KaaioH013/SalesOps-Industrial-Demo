import { eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  activities,
  contacts,
  customers,
  opportunities,
  orders,
  orderItems,
  organizations,
  productFamilies,
  products,
  profiles,
  quoteItems,
  quotes,
  salesTerritories,
  targets,
  type ActivityStatus,
  type ActivityType,
  type CustomerSize,
  type CustomerStatus,
  type OpportunityPriority,
  type OpportunityStage,
  type OrderStatus,
  type QuoteStatus,
} from "../schema";
import { DEMO_ORGANIZATION_ID, DEMO_USER_IDS, SEED } from "./constants";
import { createDemoUsers } from "./demo-users";

export const FULL_SEED_VOLUMES = {
  territories: 5,
  productFamilies: 12,
  products: 150,
  customers: 350,
  contacts: 600,
  orders: 2_500,
  orderItems: 5_000,
  quotes: 350,
  quoteItems: 700,
  opportunities: 250,
  activities: 700,
} as const;

export const SHOWCASE_IDS = {
  strategicCustomerAtRisk: "customer-full-strategic-risk",
  opportunityWithoutFollowUp: "opportunity-full-no-follow-up",
  lowMarginQuote: "quote-full-low-margin",
  highProbabilityWin: "opportunity-full-high-probability",
} as const;

type FullSeedOptions = {
  maxCustomers?: number;
};

const BASE_DATE = new Date("2026-08-24T12:00:00.000Z");
const DAY_MS = 86_400_000;

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function dateFromBase(days: number) {
  return new Date(BASE_DATE.getTime() + days * DAY_MS);
}

function monthPeriod(offset: number) {
  const date = new Date(Date.UTC(BASE_DATE.getUTCFullYear(), BASE_DATE.getUTCMonth() + offset, 1));
  return date.toISOString().slice(0, 7);
}

function scaledVolume(target: number, customerCount: number, minimum = 1) {
  return Math.max(minimum, Math.ceil((target * customerCount) / FULL_SEED_VOLUMES.customers));
}

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]!;
}

export function generateFullSeedData(options: FullSeedOptions = {}) {
  const random = createRandom(SEED);
  const customerCount = Math.min(
    FULL_SEED_VOLUMES.customers,
    Math.max(1, options.maxCustomers ?? FULL_SEED_VOLUMES.customers),
  );
  const contactCount = scaledVolume(FULL_SEED_VOLUMES.contacts, customerCount);
  const orderCount = scaledVolume(FULL_SEED_VOLUMES.orders, customerCount);
  const orderItemCount = orderCount * 2;
  const quoteCount = scaledVolume(FULL_SEED_VOLUMES.quotes, customerCount);
  const opportunityCount = scaledVolume(FULL_SEED_VOLUMES.opportunities, customerCount, 2);
  const activityCount = scaledVolume(FULL_SEED_VOLUMES.activities, customerCount);

  const territoryDefinitions = [
    ["Sudeste Industrial", "Sudeste", ["SP", "RJ", "MG", "ES"]],
    ["Sul Industrial", "Sul", ["PR", "SC", "RS"]],
    ["Centro-Oeste", "Centro-Oeste", ["GO", "MT", "MS", "DF"]],
    ["Nordeste", "Nordeste", ["BA", "PE", "CE", "MA", "RN"]],
    ["Norte", "Norte", ["AM", "PA", "RO", "TO"]],
  ] as const;
  const territories: (typeof salesTerritories.$inferInsert)[] = territoryDefinitions.map(
    ([name, region, states], index) => ({
      id: `territory-full-${String(index + 1).padStart(2, "0")}`,
      organizationId: DEMO_ORGANIZATION_ID,
      name,
      region,
      states: [...states],
      sellerId: index === 0 ? DEMO_USER_IDS.seller : DEMO_USER_IDS.manager,
    }),
  );

  const familyNames = [
    "Automação Industrial",
    "Motores Elétricos",
    "Segurança de Máquinas",
    "Acionamentos",
    "Instrumentação",
    "Painéis Elétricos",
    "Redes Industriais",
    "Sensores",
    "Pneumática",
    "Eficiência Energética",
    "Robótica",
    "Serviços Técnicos",
  ];
  const productFamilyRows: (typeof productFamilies.$inferInsert)[] = familyNames.map(
    (name, index) => ({
      id: `family-full-${String(index + 1).padStart(2, "0")}`,
      organizationId: DEMO_ORGANIZATION_ID,
      name,
      description: `Linha industrial de ${name.toLocaleLowerCase("pt-BR")}.`,
      targetMarginBps: 2_600 + (index % 5) * 300,
    }),
  );

  const productRows: (typeof products.$inferInsert)[] = Array.from(
    { length: FULL_SEED_VOLUMES.products },
    (_, index) => {
      const listPriceCents = 45_000 + Math.floor(random() * 2_000_000);
      const marginBps = 2_500 + Math.floor(random() * 2_001);
      return {
        id: `product-full-${String(index + 1).padStart(3, "0")}`,
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: productFamilyRows[index % productFamilyRows.length]!.id,
        sku: `IND-${String(index + 1).padStart(4, "0")}`,
        description: `Componente industrial série ${String(index + 1).padStart(3, "0")}`,
        application: pick(["Processos contínuos", "Máquinas", "Manutenção", "Retrofit"], random),
        listPriceCents,
        standardCostCents: Math.round(listPriceCents * (1 - marginBps / 10_000)),
        stockQuantity: Math.floor(random() * 101),
        leadTimeDays: 2 + Math.floor(random() * 29),
        status: random() < 0.96 ? "active" : "inactive",
        targetMarginBps: marginBps,
      };
    },
  );

  const segments = [
    "Siderurgia",
    "Mineração",
    "Alimentos e bebidas",
    "Automotivo",
    "Química",
    "Papel e celulose",
  ];
  const cities = [
    ["São Paulo", "SP"],
    ["Campinas", "SP"],
    ["Belo Horizonte", "MG"],
    ["Curitiba", "PR"],
    ["Joinville", "SC"],
    ["Salvador", "BA"],
  ] as const;
  const customerRows: (typeof customers.$inferInsert)[] = Array.from(
    { length: customerCount },
    (_, index) => {
      const [city, state] = pick(cities, random);
      const id =
        index === 0
          ? SHOWCASE_IDS.strategicCustomerAtRisk
          : `customer-full-${String(index + 1).padStart(3, "0")}`;
      return {
        id,
        organizationId: DEMO_ORGANIZATION_ID,
        legalName:
          index === 0
            ? "Metalúrgica Estratégica Nacional S.A."
            : `Indústria Brasileira ${String(index + 1).padStart(3, "0")} Ltda.`,
        tradeName:
          index === 0
            ? "Metalúrgica Estratégica"
            : `Industrial ${String(index + 1).padStart(3, "0")}`,
        taxId: `42.${String(index).padStart(3, "0")}.${String(index * 7).padStart(3, "0")}/0001-${String(index % 100).padStart(2, "0")}`,
        segment: pick(segments, random),
        city,
        state,
        territoryId: territories[index % territories.length]!.id,
        status: (index === 0
          ? "active"
          : pick(["active", "active", "active", "prospect", "inactive"], random)) as CustomerStatus,
        size: (index === 0 ? "large" : pick(["small", "medium", "large"], random)) as CustomerSize,
        registeredAt: dateFromBase(-60 - Math.floor(random() * 1_400)),
        sellerId: index % 4 === 0 ? DEMO_USER_IDS.manager : DEMO_USER_IDS.seller,
        creditLimitCents: index === 0 ? 50_000_000 : 500_000 + Math.floor(random() * 20_000_000),
        lastPurchaseAt:
          index === 0 ? dateFromBase(-190) : dateFromBase(-Math.floor(random() * 150)),
        notes:
          index === 0
            ? "Cliente estratégico com queda de frequência e risco de inatividade."
            : undefined,
      };
    },
  );

  const contactRows: (typeof contacts.$inferInsert)[] = Array.from(
    { length: contactCount },
    (_, index) => ({
      id: `contact-full-${String(index + 1).padStart(3, "0")}`,
      organizationId: DEMO_ORGANIZATION_ID,
      customerId: customerRows[index % customerRows.length]!.id,
      name: `Contato Industrial ${String(index + 1).padStart(3, "0")}`,
      title: pick(
        ["Gerente de Manutenção", "Comprador", "Engenheiro de Processos", "Diretor Industrial"],
        random,
      ),
      email: `contato${index + 1}@industria-demo.local`,
      phone: `+55 11 9${String(10_000_000 + index).slice(-8)}`,
      isDecisionMaker: index % 5 === 0,
      isInfluencer: index % 3 === 0,
    }),
  );

  const orderStatuses: readonly OrderStatus[] = [
    "pending",
    "confirmed",
    "in_production",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const orderRows: (typeof orders.$inferInsert)[] = [];
  const orderItemRows: (typeof orderItems.$inferInsert)[] = [];
  for (let index = 0; index < orderCount; index += 1) {
    let revenueCents = 0;
    let costCents = 0;
    const orderId = `order-full-${String(index + 1).padStart(4, "0")}`;
    for (let itemOffset = 0; itemOffset < 2; itemOffset += 1) {
      const itemIndex = index * 2 + itemOffset;
      const product = productRows[Math.floor(random() * productRows.length)]!;
      const quantity = 1 + Math.floor(random() * 8);
      const unitPriceCents = Math.round(product.listPriceCents * (0.9 + random() * 0.15));
      const totalCents = unitPriceCents * quantity;
      const itemCostCents = product.standardCostCents * quantity;
      revenueCents += totalCents;
      costCents += itemCostCents;
      orderItemRows.push({
        id: `order-item-full-${String(itemIndex + 1).padStart(5, "0")}`,
        organizationId: DEMO_ORGANIZATION_ID,
        orderId,
        productId: product.id,
        quantity,
        unitPriceCents,
        unitCostCents: product.standardCostCents,
        totalCents,
      });
    }
    orderRows.push({
      id: orderId,
      organizationId: DEMO_ORGANIZATION_ID,
      number: `PED-${String(index + 1).padStart(5, "0")}`,
      customerId: customerRows[index % customerRows.length]!.id,
      ownerId: DEMO_USER_IDS.seller,
      status: pick(orderStatuses, random),
      orderedAt: dateFromBase(-Math.floor(random() * 730)),
      revenueCents,
      costCents,
      grossMarginBps: Math.round(((revenueCents - costCents) / revenueCents) * 10_000),
    });
  }

  const quoteStatuses: readonly QuoteStatus[] = [
    "draft",
    "sent",
    "approved",
    "rejected",
    "expired",
    "won",
    "lost",
  ];
  const quoteRows: (typeof quotes.$inferInsert)[] = Array.from(
    { length: quoteCount },
    (_, index) => {
      const totalCents = 200_000 + Math.floor(random() * 20_000_000);
      const grossMarginBps = index === 0 ? 850 : 2_000 + Math.floor(random() * 2_501);
      return {
        id:
          index === 0
            ? SHOWCASE_IDS.lowMarginQuote
            : `quote-full-${String(index + 1).padStart(3, "0")}`,
        organizationId: DEMO_ORGANIZATION_ID,
        number: `COT-${String(index + 1).padStart(4, "0")}`,
        customerId: customerRows[index % customerRows.length]!.id,
        ownerId: DEMO_USER_IDS.seller,
        validUntil: dateFromBase(-30 + Math.floor(random() * 120)),
        status: index === 0 ? "sent" : pick(quoteStatuses, random),
        discountBps: index === 0 ? 2_500 : Math.floor(random() * 1_501),
        totalCents,
        costCents: Math.round(totalCents * (1 - grossMarginBps / 10_000)),
        grossMarginBps,
      };
    },
  );
  const quoteItemRows: (typeof quoteItems.$inferInsert)[] = quoteRows.flatMap(
    (quote, quoteIndex) => {
      const totalCents = quote.totalCents ?? 0;
      const costCents = quote.costCents ?? 0;
      const firstTotal = Math.floor(totalCents / 2);
      const firstCost = Math.floor(costCents / 2);
      return [0, 1].map((itemOffset) => {
        const itemIndex = quoteIndex * 2 + itemOffset;
        const product =
          productRows[(quoteIndex * 2 + itemOffset) % productRows.length]!;
        return {
          id: `quote-item-full-${String(itemIndex + 1).padStart(5, "0")}`,
          organizationId: DEMO_ORGANIZATION_ID,
          quoteId: quote.id,
          productId: product.id,
          quantity: 1,
          unitPriceCents:
            itemOffset === 0 ? firstTotal : totalCents - firstTotal,
          unitCostCents:
            itemOffset === 0 ? firstCost : costCents - firstCost,
          discountBps: quote.discountBps ?? 0,
          totalCents:
            itemOffset === 0 ? firstTotal : totalCents - firstTotal,
        };
      });
    },
  );

  const stages: readonly OpportunityStage[] = [
    "novo",
    "qualificacao",
    "diagnostico",
    "proposta",
    "negociacao",
    "ganho",
    "perdido",
  ];
  const priorities: readonly OpportunityPriority[] = ["low", "medium", "high"];
  const opportunityRows: (typeof opportunities.$inferInsert)[] = Array.from(
    { length: opportunityCount },
    (_, index) => {
      const stage = index === 1 ? "negociacao" : pick(stages, random);
      const probability =
        index === 1
          ? 95
          : stage === "ganho"
            ? 100
            : stage === "perdido"
              ? 0
              : 10 + Math.floor(random() * 81);
      return {
        id:
          index === 0
            ? SHOWCASE_IDS.opportunityWithoutFollowUp
            : index === 1
              ? SHOWCASE_IDS.highProbabilityWin
              : `opportunity-full-${String(index + 1).padStart(3, "0")}`,
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerRows[index % customerRows.length]!.id,
        title:
          index === 0
            ? "Expansão sem follow-up agendado"
            : index === 1
              ? "Modernização com alta probabilidade"
              : `Projeto industrial ${String(index + 1).padStart(3, "0")}`,
        stage,
        source: pick(["Carteira", "Indicação", "Inbound", "Feira industrial"], random),
        estimatedValueCents: 500_000 + Math.floor(random() * 30_000_000),
        probability,
        expectedCloseAt: dateFromBase(Math.floor(random() * 150) - 20),
        ownerId: DEMO_USER_IDS.seller,
        productId: productRows[index % productRows.length]!.id,
        productFamilyId: productFamilyRows[index % productFamilyRows.length]!.id,
        priority: index < 2 ? "high" : pick(priorities, random),
        nextStep: index === 0 ? null : "Realizar próxima ação comercial planejada.",
        lastActivityAt: index === 0 ? dateFromBase(-45) : dateFromBase(-Math.floor(random() * 20)),
        closedAt:
          stage === "ganho" || stage === "perdido"
            ? dateFromBase(-Math.floor(random() * 90))
            : undefined,
      };
    },
  );

  const activityTypes: readonly ActivityType[] = [
    "ligacao",
    "email",
    "visita",
    "reuniao",
    "follow_up",
  ];
  const activityStatuses: readonly ActivityStatus[] = ["planned", "completed", "cancelled"];
  const activityRows: (typeof activities.$inferInsert)[] = Array.from(
    { length: activityCount },
    (_, index) => {
      const status = pick(activityStatuses, random);
      const scheduledAt = dateFromBase(-90 + Math.floor(random() * 150));
      const opportunity = opportunityRows[1 + (index % Math.max(1, opportunityRows.length - 1))]!;
      return {
        id: `activity-full-${String(index + 1).padStart(4, "0")}`,
        organizationId: DEMO_ORGANIZATION_ID,
        type: pick(activityTypes, random),
        status,
        subject: `Interação comercial ${String(index + 1).padStart(4, "0")}`,
        description: "Atividade sintética determinística para demonstração.",
        scheduledAt,
        completedAt: status === "completed" ? scheduledAt : undefined,
        ownerId: DEMO_USER_IDS.seller,
        customerId: opportunity.customerId,
        opportunityId: opportunity.id,
      };
    },
  );

  const targetRows: (typeof targets.$inferInsert)[] = Array.from({ length: 15 }, (_, index) => ({
    id: `target-full-${monthPeriod(index - 11)}`,
    organizationId: DEMO_ORGANIZATION_ID,
    period: monthPeriod(index - 11),
    sellerId: DEMO_USER_IDS.seller,
    territoryId: territories[0]!.id,
    revenueTargetCents: 120_000_000 + index * 2_500_000,
    marginTargetCents: 36_000_000 + index * 750_000,
    newCustomersTarget: 5 + (index % 3),
    conversionTargetBps: 2_500 + (index % 4) * 100,
  }));

  if (orderItemRows.length !== orderItemCount) {
    throw new Error("Unexpected full seed order item count");
  }

  return {
    territories,
    productFamilies: productFamilyRows,
    products: productRows,
    customers: customerRows,
    contacts: contactRows,
    orders: orderRows,
    orderItems: orderItemRows,
    quotes: quoteRows,
    quoteItems: quoteItemRows,
    opportunities: opportunityRows,
    activities: activityRows,
    targets: targetRows,
  };
}

async function insertBatches<T>(values: readonly T[], insert: (batch: T[]) => Promise<unknown>) {
  const batchSize = 300;
  for (let index = 0; index < values.length; index += batchSize) {
    await insert(values.slice(index, index + batchSize));
  }
}

export async function seedFullDatabase(options: FullSeedOptions = {}) {
  const db = getDb();
  const demoUsers = await createDemoUsers();
  const data = generateFullSeedData(options);

  await db.transaction(async (tx) => {
    await tx.delete(activities).where(eq(activities.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(orderItems).where(eq(orderItems.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(orders).where(eq(orders.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(quoteItems).where(eq(quoteItems.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(quotes).where(eq(quotes.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(opportunities).where(eq(opportunities.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(targets).where(eq(targets.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(contacts).where(eq(contacts.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(customers).where(eq(customers.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(products).where(eq(products.organizationId, DEMO_ORGANIZATION_ID));
    await tx
      .delete(productFamilies)
      .where(eq(productFamilies.organizationId, DEMO_ORGANIZATION_ID));
    await tx
      .delete(salesTerritories)
      .where(eq(salesTerritories.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(profiles).where(eq(profiles.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(organizations).where(eq(organizations.id, DEMO_ORGANIZATION_ID));

    await tx.insert(organizations).values({
      id: DEMO_ORGANIZATION_ID,
      name: "Indústria Demo Brasil",
    });
    await tx.insert(profiles).values(demoUsers);
    await tx.insert(salesTerritories).values(data.territories);
    await tx.insert(productFamilies).values(data.productFamilies);
    await insertBatches(data.products, (batch) => tx.insert(products).values(batch));
    await insertBatches(data.customers, (batch) => tx.insert(customers).values(batch));
    await insertBatches(data.contacts, (batch) => tx.insert(contacts).values(batch));
    await insertBatches(data.quotes, (batch) => tx.insert(quotes).values(batch));
    await insertBatches(data.quoteItems, (batch) => tx.insert(quoteItems).values(batch));
    await insertBatches(data.opportunities, (batch) => tx.insert(opportunities).values(batch));
    await insertBatches(data.activities, (batch) => tx.insert(activities).values(batch));
    await insertBatches(data.orders, (batch) => tx.insert(orders).values(batch));
    await insertBatches(data.orderItems, (batch) => tx.insert(orderItems).values(batch));
    await tx.insert(targets).values(data.targets);
  });

  console.log(
    `Full deterministic seed ${SEED} applied: ${data.territories.length} territories, ${data.productFamilies.length} product families, ${data.products.length} products, ${data.customers.length} customers, ${data.contacts.length} contacts, ${data.orders.length} orders, ${data.orderItems.length} order items, ${data.quotes.length} quotes, ${data.quoteItems.length} quote items, ${data.opportunities.length} opportunities, ${data.activities.length} activities, ${data.targets.length} monthly targets`,
  );
  console.log("Showcase scenarios:");
  console.log(`- Strategic customer at risk: ${SHOWCASE_IDS.strategicCustomerAtRisk}`);
  console.log(`- Opportunity without follow-up: ${SHOWCASE_IDS.opportunityWithoutFollowUp}`);
  console.log(`- Low-margin quote: ${SHOWCASE_IDS.lowMarginQuote}`);
  console.log(`- High-probability win: ${SHOWCASE_IDS.highProbabilityWin}`);
}
