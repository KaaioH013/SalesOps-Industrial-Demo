import { eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  activities,
  customers,
  opportunities,
  organizations,
  organizationSettings,
  productFamilies,
  products,
  profiles,
  salesTerritories,
} from "../schema";
import { verifyPassword } from "../../lib/auth/password";
import { DEMO_ORGANIZATION_ID, DEMO_PASSWORDS, DEMO_USER_IDS, SEED } from "./constants";
import { createDemoUsers } from "./demo-users";
import { defaultOrganizationSettings } from "./org-settings";
import { seedFullDatabase } from "./full";

const territoryId = "territory-demo-southeast";
const familyIds = {
  automation: "family-demo-automation",
  motors: "family-demo-motors",
  safety: "family-demo-safety",
} as const;
const customerIds = [
  "customer-demo-aco-forte",
  "customer-demo-alimentos-serra",
  "customer-demo-autopecas-brasil",
  "customer-demo-embalagens-sul",
  "customer-demo-mineracao-horizonte",
  "customer-demo-quimica-vale",
] as const;
const productIds = [
  "product-demo-clp-compacto",
  "product-demo-clp-modular",
  "product-demo-ihm-7",
  "product-demo-inversor-10cv",
  "product-demo-motor-5cv",
  "product-demo-motor-10cv",
  "product-demo-motor-20cv",
  "product-demo-rele-seguranca",
  "product-demo-cortina-luz",
  "product-demo-botao-emergencia",
] as const;

const day = 24 * 60 * 60 * 1_000;
const baseDate = new Date("2026-08-24T12:00:00.000Z");
const daysFromBase = (days: number) => new Date(baseDate.getTime() + days * day);

async function seedMinimal() {
  const db = getDb();
  const demoUsers = await createDemoUsers();

  await db.transaction(async (tx) => {
    // Remove em ordem reversa por causa das FKs restritivas entre dados demo.
    await tx.delete(activities).where(eq(activities.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(opportunities).where(eq(opportunities.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(customers).where(eq(customers.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(products).where(eq(products.organizationId, DEMO_ORGANIZATION_ID));
    await tx
      .delete(productFamilies)
      .where(eq(productFamilies.organizationId, DEMO_ORGANIZATION_ID));
    await tx
      .delete(salesTerritories)
      .where(eq(salesTerritories.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(profiles).where(eq(profiles.organizationId, DEMO_ORGANIZATION_ID));
    await tx
      .delete(organizationSettings)
      .where(eq(organizationSettings.organizationId, DEMO_ORGANIZATION_ID));
    await tx.delete(organizations).where(eq(organizations.id, DEMO_ORGANIZATION_ID));

    await tx.insert(organizations).values({
      id: DEMO_ORGANIZATION_ID,
      name: "Indústria Demo Brasil",
    });
    await tx
      .insert(organizationSettings)
      .values(defaultOrganizationSettings(DEMO_ORGANIZATION_ID));
    await tx.insert(profiles).values(demoUsers);

    await tx.insert(salesTerritories).values({
      id: territoryId,
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Sudeste Industrial",
      region: "Sudeste",
      states: ["SP", "MG", "RJ", "ES"],
      sellerId: DEMO_USER_IDS.seller,
    });

    await tx.insert(customers).values([
      {
        id: customerIds[0],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Aço Forte S.A.",
        tradeName: "Aço Forte",
        taxId: "10.000.000/0001-01",
        segment: "Siderurgia",
        city: "Volta Redonda",
        state: "RJ",
        territoryId,
        status: "active",
        size: "large",
        registeredAt: daysFromBase(-700),
        sellerId: DEMO_USER_IDS.seller,
        creditLimitCents: 15_000_000,
        lastPurchaseAt: daysFromBase(-25),
      },
      {
        id: customerIds[1],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Alimentos Serra Ltda.",
        tradeName: "Alimentos Serra",
        taxId: "10.000.000/0002-84",
        segment: "Alimentos e bebidas",
        city: "Jundiaí",
        state: "SP",
        territoryId,
        status: "active",
        size: "medium",
        registeredAt: daysFromBase(-420),
        sellerId: DEMO_USER_IDS.seller,
        creditLimitCents: 6_000_000,
        lastPurchaseAt: daysFromBase(-48),
      },
      {
        id: customerIds[2],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Autopeças Brasil S.A.",
        tradeName: "Autopeças Brasil",
        taxId: "10.000.000/0003-65",
        segment: "Automotivo",
        city: "Betim",
        state: "MG",
        territoryId,
        status: "active",
        size: "large",
        registeredAt: daysFromBase(-610),
        sellerId: DEMO_USER_IDS.seller,
        creditLimitCents: 12_000_000,
        lastPurchaseAt: daysFromBase(-12),
      },
      {
        id: customerIds[3],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Embalagens Sul Ltda.",
        tradeName: "Embalagens Sul",
        taxId: "10.000.000/0004-46",
        segment: "Embalagens",
        city: "Campinas",
        state: "SP",
        territoryId,
        status: "prospect",
        size: "medium",
        registeredAt: daysFromBase(-90),
        sellerId: DEMO_USER_IDS.seller,
        creditLimitCents: 3_500_000,
      },
      {
        id: customerIds[4],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Mineração Horizonte S.A.",
        tradeName: "Mineração Horizonte",
        taxId: "10.000.000/0005-27",
        segment: "Mineração",
        city: "Itabira",
        state: "MG",
        territoryId,
        status: "prospect",
        size: "large",
        registeredAt: daysFromBase(-55),
        creditLimitCents: 18_000_000,
      },
      {
        id: customerIds[5],
        organizationId: DEMO_ORGANIZATION_ID,
        legalName: "Química do Vale Ltda.",
        tradeName: "Química do Vale",
        taxId: "10.000.000/0006-08",
        segment: "Química",
        city: "São José dos Campos",
        state: "SP",
        territoryId,
        status: "inactive",
        size: "small",
        registeredAt: daysFromBase(-800),
        creditLimitCents: 2_000_000,
        notes: "Conta em reativação comercial.",
      },
    ]);

    await tx.insert(productFamilies).values([
      {
        id: familyIds.automation,
        organizationId: DEMO_ORGANIZATION_ID,
        name: "Automação Industrial",
        description: "Controladores, interfaces e acionamentos.",
        targetMarginBps: 3400,
      },
      {
        id: familyIds.motors,
        organizationId: DEMO_ORGANIZATION_ID,
        name: "Motores Elétricos",
        description: "Motores trifásicos de alta eficiência.",
        targetMarginBps: 2800,
      },
      {
        id: familyIds.safety,
        organizationId: DEMO_ORGANIZATION_ID,
        name: "Segurança de Máquinas",
        description: "Componentes para adequação à NR-12.",
        targetMarginBps: 3800,
      },
    ]);

    await tx.insert(products).values([
      {
        id: productIds[0],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.automation,
        sku: "AUT-CLP-100",
        description: "CLP compacto 16 entradas e 12 saídas",
        application: "Máquinas compactas",
        listPriceCents: 485_000,
        standardCostCents: 310_000,
        stockQuantity: 18,
        leadTimeDays: 7,
        targetMarginBps: 3600,
      },
      {
        id: productIds[1],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.automation,
        sku: "AUT-CLP-300",
        description: "CLP modular com Ethernet/IP",
        application: "Linhas de produção",
        listPriceCents: 890_000,
        standardCostCents: 570_000,
        stockQuantity: 9,
        leadTimeDays: 12,
        targetMarginBps: 3600,
      },
      {
        id: productIds[2],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.automation,
        sku: "AUT-IHM-070",
        description: "IHM touch 7 polegadas",
        application: "Operação de máquinas",
        listPriceCents: 420_000,
        standardCostCents: 275_000,
        stockQuantity: 14,
        leadTimeDays: 8,
        targetMarginBps: 3450,
      },
      {
        id: productIds[3],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.automation,
        sku: "AUT-INV-010",
        description: "Inversor de frequência 10 cv",
        application: "Controle de velocidade",
        listPriceCents: 365_000,
        standardCostCents: 235_000,
        stockQuantity: 22,
        leadTimeDays: 5,
        targetMarginBps: 3550,
      },
      {
        id: productIds[4],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.motors,
        sku: "MOT-IE3-005",
        description: "Motor trifásico IE3 5 cv",
        application: "Bombas e ventiladores",
        listPriceCents: 295_000,
        standardCostCents: 215_000,
        stockQuantity: 30,
        leadTimeDays: 4,
        targetMarginBps: 2700,
      },
      {
        id: productIds[5],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.motors,
        sku: "MOT-IE3-010",
        description: "Motor trifásico IE3 10 cv",
        application: "Esteiras e compressores",
        listPriceCents: 510_000,
        standardCostCents: 365_000,
        stockQuantity: 16,
        leadTimeDays: 6,
        targetMarginBps: 2850,
      },
      {
        id: productIds[6],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.motors,
        sku: "MOT-IE4-020",
        description: "Motor trifásico IE4 20 cv",
        application: "Processos contínuos",
        listPriceCents: 980_000,
        standardCostCents: 690_000,
        stockQuantity: 7,
        leadTimeDays: 15,
        targetMarginBps: 2950,
      },
      {
        id: productIds[7],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.safety,
        sku: "SEG-REL-001",
        description: "Relé de segurança dual channel",
        application: "Circuitos de emergência",
        listPriceCents: 185_000,
        standardCostCents: 108_000,
        stockQuantity: 35,
        leadTimeDays: 3,
        targetMarginBps: 4150,
      },
      {
        id: productIds[8],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.safety,
        sku: "SEG-CTL-014",
        description: "Cortina de luz de segurança 1,4 m",
        application: "Proteção de acesso",
        listPriceCents: 760_000,
        standardCostCents: 475_000,
        stockQuantity: 8,
        leadTimeDays: 10,
        targetMarginBps: 3750,
      },
      {
        id: productIds[9],
        organizationId: DEMO_ORGANIZATION_ID,
        familyId: familyIds.safety,
        sku: "SEG-BEM-001",
        description: "Botão de emergência com retenção",
        application: "Painéis e máquinas",
        listPriceCents: 45_000,
        standardCostCents: 25_000,
        stockQuantity: 80,
        leadTimeDays: 2,
        targetMarginBps: 4400,
      },
    ]);

    await tx.insert(opportunities).values([
      {
        id: "opportunity-demo-01",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[0],
        title: "Modernização da linha de laminação",
        stage: "negociacao",
        source: "Indicação",
        estimatedValueCents: 24_500_000,
        probability: 75,
        expectedCloseAt: daysFromBase(18),
        ownerId: DEMO_USER_IDS.seller,
        productId: productIds[1],
        productFamilyId: familyIds.automation,
        priority: "high",
        nextStep: "Validar condição comercial final.",
        lastActivityAt: daysFromBase(-1),
      },
      {
        id: "opportunity-demo-02",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[1],
        title: "Automação de envase",
        stage: "proposta",
        source: "Feira industrial",
        estimatedValueCents: 8_900_000,
        probability: 55,
        expectedCloseAt: daysFromBase(32),
        ownerId: DEMO_USER_IDS.seller,
        productId: productIds[0],
        productFamilyId: familyIds.automation,
        priority: "medium",
        nextStep: "Apresentar retorno do investimento.",
        lastActivityAt: daysFromBase(-3),
      },
      {
        id: "opportunity-demo-03",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[2],
        title: "Adequação NR-12 da célula de montagem",
        stage: "diagnostico",
        source: "Carteira",
        estimatedValueCents: 6_750_000,
        probability: 35,
        expectedCloseAt: daysFromBase(45),
        ownerId: DEMO_USER_IDS.seller,
        productId: productIds[8],
        productFamilyId: familyIds.safety,
        priority: "high",
        nextStep: "Concluir levantamento técnico.",
        lastActivityAt: daysFromBase(-2),
      },
      {
        id: "opportunity-demo-04",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[3],
        title: "Retrofit de esteiras transportadoras",
        stage: "qualificacao",
        source: "Inbound",
        estimatedValueCents: 4_200_000,
        probability: 20,
        expectedCloseAt: daysFromBase(60),
        ownerId: DEMO_USER_IDS.seller,
        productId: productIds[5],
        productFamilyId: familyIds.motors,
        priority: "medium",
        nextStep: "Confirmar orçamento disponível.",
      },
      {
        id: "opportunity-demo-05",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[4],
        title: "Motores de alta eficiência para britagem",
        stage: "novo",
        source: "Prospecção",
        estimatedValueCents: 13_800_000,
        probability: 10,
        expectedCloseAt: daysFromBase(75),
        ownerId: DEMO_USER_IDS.manager,
        productId: productIds[6],
        productFamilyId: familyIds.motors,
        priority: "high",
        nextStep: "Agendar reunião de descoberta.",
      },
      {
        id: "opportunity-demo-06",
        organizationId: DEMO_ORGANIZATION_ID,
        customerId: customerIds[5],
        title: "Painéis para unidade de tratamento",
        stage: "ganho",
        source: "Reativação",
        estimatedValueCents: 5_600_000,
        probability: 100,
        ownerId: DEMO_USER_IDS.seller,
        productId: productIds[2],
        productFamilyId: familyIds.automation,
        priority: "low",
        nextStep: "Acompanhar implantação.",
        stageChangedAt: daysFromBase(-20),
        lastActivityAt: daysFromBase(-15),
        closedAt: daysFromBase(-20),
      },
    ]);

    await tx.insert(activities).values([
      {
        id: "activity-demo-01",
        organizationId: DEMO_ORGANIZATION_ID,
        type: "reuniao",
        status: "completed",
        subject: "Revisão técnica da laminação",
        description: "Alinhamento de escopo com engenharia e manutenção.",
        scheduledAt: daysFromBase(-2),
        completedAt: daysFromBase(-2),
        ownerId: DEMO_USER_IDS.seller,
        customerId: customerIds[0],
        opportunityId: "opportunity-demo-01",
      },
      {
        id: "activity-demo-02",
        organizationId: DEMO_ORGANIZATION_ID,
        type: "follow_up",
        status: "planned",
        subject: "Retorno sobre proposta de envase",
        scheduledAt: daysFromBase(2),
        ownerId: DEMO_USER_IDS.seller,
        customerId: customerIds[1],
        opportunityId: "opportunity-demo-02",
      },
      {
        id: "activity-demo-03",
        organizationId: DEMO_ORGANIZATION_ID,
        type: "visita",
        status: "planned",
        subject: "Levantamento de segurança NR-12",
        scheduledAt: daysFromBase(5),
        ownerId: DEMO_USER_IDS.seller,
        customerId: customerIds[2],
        opportunityId: "opportunity-demo-03",
      },
      {
        id: "activity-demo-04",
        organizationId: DEMO_ORGANIZATION_ID,
        type: "ligacao",
        status: "completed",
        subject: "Qualificação de retrofit",
        scheduledAt: daysFromBase(-4),
        completedAt: daysFromBase(-4),
        ownerId: DEMO_USER_IDS.seller,
        customerId: customerIds[3],
        opportunityId: "opportunity-demo-04",
      },
      {
        id: "activity-demo-05",
        organizationId: DEMO_ORGANIZATION_ID,
        type: "email",
        status: "planned",
        subject: "Apresentação da linha IE4",
        scheduledAt: daysFromBase(1),
        ownerId: DEMO_USER_IDS.manager,
        customerId: customerIds[4],
        opportunityId: "opportunity-demo-05",
      },
    ]);
  });

  const admin = await db.query.profiles.findFirst({
    where: eq(profiles.email, "admin@demo.local"),
  });
  const adminLoginIsValid =
    admin && (await verifyPassword(DEMO_PASSWORDS.admin, admin.passwordHash));

  if (!adminLoginIsValid) {
    throw new Error("Demo admin login verification failed");
  }

  console.log(
    `Demo seed ${SEED} applied: 1 organization, 3 users, 1 territory, 6 customers, 10 products, 6 opportunities, 5 activities`,
  );
  console.log("Verified login credentials for admin@demo.local");
}

async function main() {
  if (process.argv.includes("--full")) {
    const maxCustomersValue = process.env.FULL_SEED_MAX_CUSTOMERS;
    const maxCustomers = maxCustomersValue ? Number.parseInt(maxCustomersValue, 10) : undefined;

    if (maxCustomersValue && (!Number.isInteger(maxCustomers) || (maxCustomers ?? 0) < 1)) {
      throw new Error("FULL_SEED_MAX_CUSTOMERS must be a positive integer");
    }

    await seedFullDatabase({ maxCustomers });
    return;
  }

  await seedMinimal();
}

main().catch((error: unknown) => {
  console.error("Database seed failed", error);
  process.exitCode = 1;
});
