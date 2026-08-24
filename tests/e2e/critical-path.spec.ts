import { expect, test } from "@playwright/test";

test("admin acessa um cliente e cria uma atividade", async ({ page }) => {
  const subject = `Follow-up E2E ${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@demo.local");
  await page.getByLabel("Senha").fill("DemoAdmin!123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Dashboard executivo" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await expect(page).toHaveURL(/\/customers$/);

  const firstCustomer = page.locator('tbody a[href^="/customers/"]').first();
  await expect(firstCustomer).toBeVisible();
  await firstCustomer.click();

  await expect(page).toHaveURL(/\/customers\/[^/]+$/);
  await page.getByText("Nova atividade", { exact: true }).click();
  await page.getByLabel("Assunto").fill(subject);
  await page.getByLabel("Agendada para").fill("2026-08-25T10:00");
  await page.getByRole("button", { name: "Criar atividade" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Atividade criada com sucesso.",
  );
  await expect(page.getByText(subject, { exact: true })).toBeVisible();
});
