// Captures only the public synthetic demo data.\nimport { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.PORTFOLIO_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = path.join(projectRoot, "docs", "portfolio", "images");
const startServer = !process.env.PORTFOLIO_BASE_URL;

function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const response = await fetch(`${url}/login`);
        if (response.ok) return resolve();
      } catch {
        // The local server is still starting.
      }

      if (Date.now() >= deadline) {
        return reject(new Error(`Servidor não respondeu em ${url} dentro de ${timeoutMs} ms.`));
      }
      setTimeout(check, 500);
    };
    void check();
  });
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const server = startServer
    ? spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
        cwd: projectRoot,
        env: {
          ...process.env,
          TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
          AUTH_SECRET: process.env.AUTH_SECRET ?? "portfolio-local-demo-secret",
        },
        stdio: "inherit",
      })
    : undefined;

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });

    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("E-mail").fill("admin@demo.local");
    await page.getByLabel("Senha").fill("DemoAdmin!123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/dashboard");
    await page.screenshot({ path: path.join(outputDir, "dashboard-demo.png"), fullPage: true });

    await page.getByRole("link", { name: "Clientes", exact: true }).click();
    await page.waitForURL("**/customers");
    await page.screenshot({ path: path.join(outputDir, "customers-demo.png"), fullPage: true });

    await page.locator('tbody a[href^="/customers/"]').first().click();
    await page.waitForURL(/\/customers\/[^/]+$/);
    await page.screenshot({
      path: path.join(outputDir, "customer-detail-demo.png"),
      fullPage: true,
    });

    await browser.close();
    console.log(`Capturas geradas em ${path.relative(projectRoot, outputDir)}.`);
  } finally {
    if (server) server.kill("SIGTERM");
  }
}

void main();
