/**
 * Seeds baseline roles/permissions, an optional initial admin
 * (SEED_ADMIN_* — see src/config/seedEnv.ts), plus synthetic demo data
 * for the template's map/chart/table gallery pages. Idempotent (safe to
 * re-run, and deploy.sh re-runs it on every deploy) — uses upsert
 * throughout, and clears+recreates child rows for demo datasets so
 * re-seeding never duplicates points/rows.
 *
 * Needs only DATABASE_URL (plus SEED_ADMIN_* and BCRYPT_SALT_ROUNDS when
 * creating an admin) — not the HTTP server's config.
 */
import type { Prisma } from "../generated/prisma/client.js";
import { loadSeedEnv } from "../src/config/seedEnv.js";
import { createPrismaClient } from "../src/lib/prismaClientFactory.js";
import { seedInitialAdmin } from "../src/seed/initialAdmin.js";

const seedEnv = loadSeedEnv();
const prisma = createPrismaClient(seedEnv.databaseUrl);

const PERMISSIONS = [
  { key: "users:read", description: "View user accounts" },
  { key: "users:write", description: "Create, edit, or deactivate user accounts" },
  { key: "roles:manage", description: "Assign or modify roles and permissions" },
] as const;

const ROLES: Record<string, { description: string; permissions: string[] }> = {
  admin: {
    description: "Full administrative access",
    permissions: ["users:read", "users:write", "roles:manage"],
  },
  manager: {
    description: "Can view user accounts",
    permissions: ["users:read"],
  },
  user: {
    description: "Standard authenticated user, no elevated access",
    permissions: [],
  },
};

async function seedRolesAndPermissions(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const [name, definition] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: definition.description },
      create: { name, description: definition.description },
    });

    for (const permissionKey of definition.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.info("Seed: roles and permissions are up to date.");
}

// --- Demo state metrics (Dashboard maps) -----------------------------

/** [name, code] pairs — must match front-end/public/data/india-districts.geojson's st_nm/st_code. All 36 states/UTs. */
const DEMO_STATES: Array<[name: string, code: string]> = [
  ["Mizoram", "15"], ["Tamil Nadu", "33"], ["Madhya Pradesh", "23"], ["Maharashtra", "27"],
  ["Chhattisgarh", "22"], ["Gujarat", "24"], ["Odisha", "21"], ["Andhra Pradesh", "37"],
  ["Karnataka", "29"], ["Goa", "30"], ["Kerala", "32"], ["Telangana", "36"],
  ["West Bengal", "19"], ["Puducherry", "34"], ["Arunachal Pradesh", "12"], ["Assam", "18"],
  ["Nagaland", "13"], ["Meghalaya", "17"], ["Manipur", "14"], ["Tripura", "16"],
  ["Uttar Pradesh", "09"], ["Rajasthan", "08"], ["Delhi", "07"], ["Haryana", "06"],
  ["Sikkim", "11"], ["Bihar", "10"], ["Jharkhand", "20"], ["Ladakh", "38"],
  ["Jammu and Kashmir", "01"], ["Himachal Pradesh", "02"], ["Punjab", "03"], ["Uttarakhand", "05"],
  ["Chandigarh", "04"], ["Lakshadweep", "31"], ["Andaman and Nicobar Islands", "35"],
  ["Dadra and Nagar Haveli and Daman and Diu", "26"],
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDemoStateMetrics(): Promise<void> {
  for (const [stateName, stateCode] of DEMO_STATES) {
    // Skewed toward low/zero project counts with a few standouts, same
    // shape as the old frontend-generated distribution.
    const roll = Math.random();
    const projectCount =
      roll < 0.3 ? 0 :
      roll < 0.55 ? randomInt(1, 5) :
      roll < 0.75 ? randomInt(5, 19) :
      roll < 0.88 ? randomInt(20, 49) :
      roll < 0.96 ? randomInt(50, 99) :
      randomInt(100, 150);

    await prisma.demoStateMetric.upsert({
      where: { stateCode },
      update: { stateName, projectCount, activityIntensity: randomInt(0, 100) },
      create: { stateCode, stateName, projectCount, activityIntensity: randomInt(0, 100) },
    });
  }

  console.info(`Seed: ${String(DEMO_STATES.length)} demo state metrics up to date.`);
}

// --- Demo chart datasets (Graphs/Charts gallery) ----------------------

interface ChartPointSeed {
  label: string;
  value: number;
  series?: string;
}

interface ChartDatasetSeed {
  slug: string;
  title: string;
  chartType: "bar" | "line" | "area" | "pie" | "donut" | "radial";
  description: string;
  points: ChartPointSeed[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const CHART_DATASETS: ChartDatasetSeed[] = [
  {
    slug: "monthly-revenue",
    title: "Monthly Revenue",
    chartType: "bar",
    description: "Single-series bar chart — revenue per month.",
    points: MONTHS.map((label) => ({ label, value: randomInt(20_000, 90_000) })),
  },
  {
    slug: "quarterly-sales-by-region",
    title: "Quarterly Sales by Region",
    chartType: "bar",
    description: "Grouped bar chart — multiple series sharing the same labels.",
    points: ["Q1", "Q2", "Q3", "Q4"].flatMap((quarter) =>
      ["North", "South", "East", "West"].map((region) => ({
        label: quarter,
        series: region,
        value: randomInt(5_000, 40_000),
      })),
    ),
  },
  {
    slug: "website-traffic",
    title: "Website Traffic",
    chartType: "line",
    description: "Single-series line chart — daily visits.",
    points: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
      label,
      value: randomInt(800, 5_000),
    })),
  },
  {
    slug: "revenue-vs-cost",
    title: "Revenue vs. Cost",
    chartType: "line",
    description: "Multi-series line chart — two series sharing the same labels.",
    points: MONTHS.flatMap((label) => [
      { label, series: "Revenue", value: randomInt(30_000, 90_000) },
      { label, series: "Cost", value: randomInt(15_000, 50_000) },
    ]),
  },
  {
    slug: "user-growth",
    title: "User Growth",
    chartType: "area",
    description: "Area chart — cumulative users over time.",
    points: (() => {
      let total = randomInt(200, 500);
      return MONTHS.map((label) => {
        total += randomInt(100, 800);
        return { label, value: total };
      });
    })(),
  },
  {
    slug: "market-share",
    title: "Market Share",
    chartType: "pie",
    description: "Pie chart — share of total by category.",
    points: ["Product A", "Product B", "Product C", "Product D", "Other"].map((label) => ({
      label,
      value: randomInt(10, 40),
    })),
  },
  {
    slug: "budget-allocation",
    title: "Budget Allocation",
    chartType: "donut",
    description: "Donut chart — share of total budget by department.",
    points: ["Engineering", "Marketing", "Sales", "Operations", "Support"].map((label) => ({
      label,
      value: randomInt(10, 35),
    })),
  },
  {
    slug: "team-performance",
    title: "Team Performance",
    chartType: "radial",
    description: "Radial chart — percentage completion per team.",
    points: ["Frontend", "Backend", "QA", "DevOps"].map((label) => ({
      label,
      value: randomInt(45, 98),
    })),
  },
];

async function seedDemoChartDatasets(): Promise<void> {
  for (const dataset of CHART_DATASETS) {
    const record = await prisma.demoChartDataset.upsert({
      where: { slug: dataset.slug },
      update: { title: dataset.title, chartType: dataset.chartType, description: dataset.description },
      create: {
        slug: dataset.slug,
        title: dataset.title,
        chartType: dataset.chartType,
        description: dataset.description,
      },
    });

    // Simplest idempotent strategy for child rows: replace them wholesale.
    await prisma.demoChartPoint.deleteMany({ where: { datasetId: record.id } });
    await prisma.demoChartPoint.createMany({
      data: dataset.points.map((point, index) => ({
        datasetId: record.id,
        label: point.label,
        series: point.series,
        value: point.value,
        sortOrder: index,
      })),
    });
  }

  console.info(`Seed: ${String(CHART_DATASETS.length)} demo chart datasets up to date.`);
}

// --- Demo table datasets (Tables gallery) -----------------------------

interface TableDatasetSeed {
  slug: string;
  title: string;
  description: string;
  rows: Prisma.InputJsonObject[];
}

const ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"];
const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "Support", "Operations"];
const CATEGORIES = ["Electronics", "Apparel", "Home & Kitchen", "Sports", "Books"];

function randomFrom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

const TABLE_DATASETS: TableDatasetSeed[] = [
  {
    slug: "orders",
    title: "Orders",
    description: "A typical e-commerce order list — id, customer, amount, status, date.",
    rows: Array.from({ length: 24 }, (_, index) => ({
      orderId: `ORD-${String(1000 + index)}`,
      customer: `Customer ${String(index + 1)}`,
      amount: randomInt(500, 15_000),
      status: randomFrom(ORDER_STATUSES),
      placedOn: new Date(Date.now() - randomInt(0, 60) * 86_400_000).toISOString().slice(0, 10),
    })),
  },
  {
    slug: "employees",
    title: "Employees",
    description: "A typical HR/admin employee directory.",
    rows: Array.from({ length: 18 }, (_, index) => ({
      name: `Employee ${String(index + 1)}`,
      department: randomFrom(DEPARTMENTS),
      email: `employee${String(index + 1)}@example.com`,
      isActive: Math.random() > 0.15,
    })),
  },
  {
    slug: "products",
    title: "Products",
    description: "A typical product catalog — name, category, price, stock, rating.",
    rows: Array.from({ length: 20 }, (_, index) => ({
      name: `Product ${String(index + 1)}`,
      category: randomFrom(CATEGORIES),
      price: randomInt(199, 24_999),
      stock: randomInt(0, 500),
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
    })),
  },
];

async function seedDemoTableDatasets(): Promise<void> {
  for (const dataset of TABLE_DATASETS) {
    const record = await prisma.demoTableDataset.upsert({
      where: { slug: dataset.slug },
      update: { title: dataset.title, description: dataset.description },
      create: { slug: dataset.slug, title: dataset.title, description: dataset.description },
    });

    await prisma.demoTableRow.deleteMany({ where: { datasetId: record.id } });
    await prisma.demoTableRow.createMany({
      data: dataset.rows.map((row, index) => ({
        datasetId: record.id,
        data: row,
        sortOrder: index,
      })),
    });
  }

  console.info(`Seed: ${String(TABLE_DATASETS.length)} demo table datasets up to date.`);
}

async function seedAdmin(): Promise<void> {
  if (!seedEnv.initialAdmin) {
    console.info("Seed: no SEED_ADMIN_EMAIL set, skipping initial admin.");
    return;
  }

  const outcome = await seedInitialAdmin(prisma, seedEnv.initialAdmin);
  const messages = {
    created: "created with the admin role",
    promoted: "already existed; admin role granted (password left unchanged)",
    unchanged: "already an admin; nothing to do (password left unchanged)",
  };
  console.info(`Seed: initial admin ${seedEnv.initialAdmin.email} ${messages[outcome]}.`);
}

async function main(): Promise<void> {
  await seedRolesAndPermissions();
  await seedAdmin();
  await seedDemoStateMetrics();
  await seedDemoChartDatasets();
  await seedDemoTableDatasets();
  console.info("Seed complete.");
}

await main();
await prisma.$disconnect();
