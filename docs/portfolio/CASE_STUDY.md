# Case study — SalesOps Industrial Demo

## Visão geral

O SalesOps Industrial Demo é uma aplicação web demonstrativa para organizar a rotina comercial B2B: carteira, oportunidades, cotações, pedidos, atividades e indicadores. O objetivo é mostrar como dados comerciais podem ser convertidos em uma rotina de acompanhamento mais clara para vendedores e gestores.

Todos os registros da demonstração são sintéticos. Nomes, usuários, documentos e valores não representam clientes, pedidos ou resultados reais.

## Problema abordado

Em operações B2B, a informação comercial costuma ficar distribuída entre ERP, planilhas e contatos individuais. Isso dificulta responder perguntas simples: quais oportunidades precisam de ação, quais clientes estão sem acompanhamento e como a carteira evolui.

## Solução demonstrada

O produto concentra as principais entidades comerciais e restringe a informação de acordo com o perfil de acesso.

| Área | Demonstração |
| --- | --- |
| Dashboard | Indicadores, alertas e visão da carteira |
| Clientes | Consulta de contexto comercial e registro de atividades |
| Pipeline | Acompanhamento de oportunidades por etapa |
| Cotações e pedidos | Consulta detalhada do fluxo comercial |
| Perfis | Permissões para administrador, gerente e vendedor |
| Relatórios | Exportação de dados de demonstração |

## Percurso de demonstração

1. Acessar a aplicação com o usuário administrador de demonstração.
2. Abrir o dashboard executivo e analisar os indicadores apresentados.
3. Consultar a lista de clientes.
4. Abrir um cliente e registrar uma atividade de follow-up.
5. Navegar para pipeline, cotações, pedidos e relatórios.

O teste E2E em `tests/e2e/critical-path.spec.ts` cobre o caminho de login, abertura de cliente e criação de atividade.

## Decisões técnicas

| Tema | Decisão |
| --- | --- |
| Aplicação | Next.js com TypeScript e App Router |
| Banco da demonstração | Turso/libSQL com Drizzle ORM |
| Autenticação | Auth.js e allowlist de contas `@demo.local` |
| Acesso a dados | Regras de perfil aplicadas no servidor |
| Qualidade | Testes unitários para regras, consultas, validações e exportação; fluxo E2E com Playwright |

## Como gerar as capturas do portfólio

Após instalar dependências, migrar e carregar a base local, execute:

```bash
npx playwright install chromium
npm run capture:portfolio
```

As imagens serão salvas em `docs/portfolio/images/`. O comando utiliza exclusivamente a base local `local.db` e as credenciais públicas de demonstração. Antes de publicar uma imagem, confirme que ela contém apenas os dados sintéticos do seed.

## Limites da demonstração

Esta é uma aplicação de portfólio. A autenticação, o controle de acesso e a estrutura de dados foram implementados para demonstrar decisões de produto e engenharia; uma operação com dados reais exige revisão de segurança, hospedagem, monitoramento e requisitos próprios.
