// ============================================================
// fluxo-principal.spec.js
// Teste end-to-end do fluxo principal do STEAM Planner
// ============================================================
//
// Cobre o caminho completo do professor:
//   Login → Dashboard → Criar projeto → Editar → Fase →
//   Diário → Voltar → Referências
//
// Credenciais: defina as variáveis de ambiente antes de rodar:
//   TEST_EMAIL=seu@email.com TEST_PASSWORD=sua_senha npx playwright test
//
// Sem credenciais, apenas os testes de UI/smoke são executados.
// ============================================================

import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const HAS_CREDENTIALS = EMAIL.length > 0 && PASSWORD.length > 0;

// ── Helpers ────────────────────────────────────────────────

async function login(page, email, password) {
  await page.getByText("Fazer login").click();
  await page.getByPlaceholder("Digite seu email").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Meus Projetos STEAM")).toBeVisible({ timeout: 10_000 });
}

async function criarProjeto(page) {
  const btnVazio = page.getByText("+ Criar projeto em branco");
  const btnNovo = page.getByText("+ Novo projeto");
  if (await btnVazio.isVisible().catch(() => false)) {
    await btnVazio.click();
  } else {
    await btnNovo.click();
  }
  await expect(page.getByText("Identificação")).toBeVisible({ timeout: 5_000 });
}

// ── 1. Tela de login (smoke — sem credenciais) ─────────────

test.describe("Tela de login", () => {
  test("exibe os botões Fazer login e Criar conta", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Fazer login")).toBeVisible();
    await expect(page.getByText("Criar conta")).toBeVisible();
  });

  test("exibe formulário ao clicar em Fazer login", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Fazer login").click();
    await expect(page.getByPlaceholder("Digite seu email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("mostra erro com credenciais vazias", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Fazer login").click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Preencha todos os campos")).toBeVisible();
  });

  test("exibe formulário de cadastro ao clicar em Criar conta", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Criar conta").click();
    await expect(page.getByText("Nome completo")).toBeVisible();
  });
});

// ── 2. Fluxo autenticado (requer TEST_EMAIL + TEST_PASSWORD) ─

test.describe("Fluxo principal autenticado", () => {
  test.skip(!HAS_CREDENTIALS, "Defina TEST_EMAIL e TEST_PASSWORD para rodar este bloco.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page, EMAIL, PASSWORD);
  });

  // ── Dashboard ─────────────────────────────────────────────

  test("dashboard carrega e exibe título", async ({ page }) => {
    await expect(page.getByText("Meus Projetos STEAM")).toBeVisible();
  });

  // ── Criar projeto em branco ───────────────────────────────

  test("cria projeto em branco e abre editor", async ({ page }) => {
    await criarProjeto(page);
    await expect(page.getByText("Identificação")).toBeVisible();
  });

  // ── Editar projeto ────────────────────────────────────────

  test("preenche título e salva o projeto", async ({ page }) => {
    await criarProjeto(page);
    await page.getByLabel("Título do projeto").fill("Projeto Teste Playwright");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByDisplayValue("Projeto Teste Playwright")).toBeVisible();
  });

  // ── Navegar para uma fase ─────────────────────────────────

  test("abre a fase Imersão pelo card de fases", async ({ page }) => {
    await criarProjeto(page);
    await expect(page.getByText("As cinco fases STEAM")).toBeVisible();
    await page.getByText("Imersão").first().click();
    await expect(page.getByText("Plano pedagógico desta fase")).toBeVisible({ timeout: 5_000 });
  });

  // ── Diário de bordo ───────────────────────────────────────

  test("adiciona registro no diário de bordo com data", async ({ page }) => {
    await criarProjeto(page);
    await page.getByText("Imersão").first().click();
    await expect(page.getByText("Diário de bordo da fase")).toBeVisible();

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();

    await page.locator("textarea").first().fill("Aula de imersão: estudantes exploraram o tema.");
    await page.getByRole("button", { name: "Gravar registro" }).click();
    await expect(page.getByText("Aula de imersão: estudantes exploraram o tema.")).toBeVisible();
  });

  // ── Botão + Outro dia ─────────────────────────────────────

  test("botão + Outro dia adiciona novo campo de data", async ({ page }) => {
    await criarProjeto(page);
    await page.getByText("Imersão").first().click();

    const inicial = await page.locator('input[type="date"]').count();
    await page.getByRole("button", { name: "+ Outro dia" }).click();
    const depois = await page.locator('input[type="date"]').count();

    expect(depois).toBeGreaterThan(inicial);
  });

  // ── Voltar ao projeto ─────────────────────────────────────

  test("volta ao editor após visitar uma fase", async ({ page }) => {
    await criarProjeto(page);
    await page.getByText("Imersão").first().click();
    await page.getByText("← Voltar ao projeto").click();
    await expect(page.getByText("As cinco fases STEAM")).toBeVisible({ timeout: 5_000 });
  });

  // ── Referências Bibliográficas ────────────────────────────

  test("abre editor de referências e adiciona manualmente", async ({ page }) => {
    await criarProjeto(page);
    await page.getByText("Referências Bibliográficas").first().click();
    await expect(page.getByText("Adicionar referência manualmente")).toBeVisible({ timeout: 5_000 });

    const refText = "BACICH, L.; HOLANDA, L. (org.). STEAM em sala de aula. Porto Alegre: Penso, 2020.";
    await page.locator("textarea").first().fill(refText);
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(refText)).toBeVisible();
  });

  // ── Contagem de dias no Dashboard ─────────────────────────

  test("projeto com duração exibe contagem de dias no card", async ({ page }) => {
    await criarProjeto(page);
    await page.getByLabel("Título do projeto").fill("Teste Timeline");
    await page.getByLabel("Duração").fill("4 semanas");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await page.getByText("← Voltar para projetos").click();
    await expect(page.getByText(/dia/i).first()).toBeVisible();
  });
});
