# Prompt para o Cursor — SalesOps Industrial Demo

Copie todo o texto abaixo e cole no Cursor, na raiz de um repositório vazio.

---

Você é um engenheiro de software sênior, especialista em produtos B2B, Sales Operations, UX para dashboards e aplicações full-stack com Next.js. Crie uma aplicação de portfólio completa, funcional e pronta para deploy chamada **SalesOps Industrial Demo**.

## Contexto e objetivo

O produto simula a operação comercial de uma distribuidora B2B de peças industriais. Ele deve demonstrar como dados de ERP, CRM e vendas podem ajudar um coordenador comercial a decidir onde agir: quais clientes priorizar, quais oportunidades estão em risco, quais clientes estão perto de recomprar e onde existe risco de margem.

Este é um case de portfólio. **Todos os dados devem ser sintéticos**, criados pelo próprio projeto. Não use marcas reais, dados reais, logotipos de terceiros, nomes de pessoas reais ou informações de empresas reais. Deixe visível, de maneira discreta, o selo: “Dados demonstrativos e sintéticos”.

O objetivo não é parecer um ERP gigantesco. O objetivo é ser uma demonstração excelente, coerente e navegável de Sales Operations e Inteligência Comercial B2B Industrial.

## Resultado esperado

Entregue uma aplicação web de qualidade profissional, responsiva, acessível e publicada facilmente na Vercel. A primeira versão deve ser totalmente navegável, com dados persistidos e fluxos que funcionem de verdade. Nada de botões decorativos, telas vazias, pseudo-ML ou textos genéricos.

Use uma abordagem incremental:

1. Antes de escrever código, apresente um plano curto com arquitetura, entidades e rotas.
2. Implemente primeiro um MVP completo e executável com dados sintéticos e autenticação demo.
3. Rode lint, checagem de tipos e testes relevantes antes de declarar conclusão.
4. Só então implemente os incrementos avançados de ML e refinamentos, mantendo o app funcionando em cada etapa.
5. Ao terminar, forneça README completo com instruções locais, variáveis de ambiente, seed, deploy e credenciais demo.

Não interrompa para fazer perguntas se uma decisão razoável puder ser tomada. Faça escolhas explícitas e documente-as no README.

## Stack obrigatória

- Next.js atual com App Router e TypeScript em modo estrito.
- React Server Components por padrão; Client Components apenas onde houver interação.
- Tailwind CSS.
- shadcn/ui para componentes de base, com componentes próprios quando necessário.
- Supabase: Postgres, Auth e Row Level Security.
- `@supabase/ssr` e `@supabase/supabase-js` seguindo o padrão atual de SSR com cookies.
- Drizzle ORM com migrations SQL versionadas. Se houver conflito técnico real com Supabase, use SQL migrations bem organizadas e documente a escolha.
- Zod para validação de formulários, query params e payloads do servidor.
- React Hook Form.
- TanStack Table para tabelas com ordenação, paginação, filtros e visibilidade de colunas.
- Recharts para gráficos.
- Lucide React para ícones.
- date-fns para datas.
- Vitest para regras de negócio e Playwright para ao menos um fluxo crítico.
- ESLint e Prettier.

Não use bibliotecas abandonadas. Não exponha service role key no cliente. Não use `any`, dados mockados espalhados por componentes ou estado global desnecessário.

## Deploy e ambiente

O app deve poder ser publicado na Vercel e usar Supabase em produção.

Crie `.env.example` com apenas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Explique no README que a service role é exclusiva do servidor/seed e nunca deve ser publicada ou colocada em `NEXT_PUBLIC_*`.

Inclua tratamento claro quando as variáveis de ambiente estiverem ausentes. Crie uma estratégia de modo demonstração local: se o banco ainda não tiver dados, instruções claras para aplicar migrations e rodar o seed. Não faça fallback silencioso para dados falsos em produção.

## Identidade visual e UX

Nome: **SalesOps Industrial Demo**.

Direção visual: SaaS B2B industrial sóbrio e moderno. Fundo claro levemente acinzentado, azul profundo como cor principal, verde reservado para indicadores positivos, âmbar para atenção e vermelho apenas para risco. Nada de gradientes excessivos, glassmorphism, cards genéricos demais ou visual de template de IA.

- Sidebar fixa no desktop e navegação por menu no mobile.
- Cabeçalho com busca global, período ativo e usuário demo.
- Tipografia legível, boa densidade de informação, grids consistentes e espaçamento generoso.
- Todos os gráficos e cards precisam ter estado de carregamento, vazio e erro quando aplicável.
- Tabelas devem funcionar em telas menores sem destruir a leitura.
- Use `aria-label`, foco visível, contraste adequado e navegação por teclado nas interações principais.
- Sempre exiba dados em BRL, datas pt-BR e percentuais com casas coerentes.

## Papéis e autenticação

Implemente autenticação por e-mail e senha com Supabase Auth.

Papéis:

- `admin`: acesso completo e criação/edição de registros.
- `manager`: visualiza tudo e edita oportunidades, atividades e cotações.
- `seller`: visualiza somente clientes, oportunidades e atividades atribuídas a si; não acessa custos internos nem relatórios de margem detalhados.

Crie dados de seed para três usuários demo, com as credenciais documentadas apenas no README local (sem credenciais reais ou secretas). Mostre um seletor de perfil no ambiente de demonstração, sem burlar autenticação e sem permitir escalonamento de privilégio em produção.

Defina RLS para que as permissões sejam aplicadas no banco, não somente na interface. Proteja todas as rotas e Server Actions. Valide autorização no servidor antes de ler ou mutar dados.

## Modelo de domínio

Crie migrations, tipos e relações consistentes para as entidades abaixo. Inclua `created_at`, `updated_at`, campos de auditoria relevantes e índices para filtros usuais.

### Organização e pessoas

- `organizations`: preparada para multi-tenant, embora o seed use uma organização.
- `profiles`: usuário, organização, nome, cargo e role.
- `sales_territories`: região, estado(s), vendedor responsável.

### Clientes e contatos

- `customers`: razão social fictícia, nome fantasia, CNPJ sintético claramente inválido, segmento, cidade, UF, território, status, porte, data de cadastro, vendedor responsável, limite de crédito demonstrativo, última compra e observações.
- `contacts`: cliente, nome sintético, cargo, e-mail sintético, telefone sintético, decisor/influenciador.
- `customer_notes`: histórico de observações e alterações relevantes.

### Produtos e comercial

- `product_families`: por exemplo, bombas helicoidais, rotores, estatores, juntas, vedações, peças de manutenção.
- `products`: SKU fictício, descrição, família, aplicação, preço de tabela, custo padrão, estoque, lead time, status e margem alvo.
- `price_lists` e `price_list_items`: tabela padrão e tabela por cliente/segmento.
- `quotes` e `quote_items`: cliente, responsável, validade, status, desconto, total, custo, margem bruta e motivo de perda quando houver.
- `orders` e `order_items`: pedido, cliente, origem da cotação, situação, data, receita, custo, margem e itens.

### CRM e operação comercial

- `opportunities`: cliente, título, etapa, origem, valor estimado, probabilidade, data prevista de fechamento, vendedor, produto/família de interesse, prioridade, próximo passo, motivo de perda e timestamps de movimentação.
- Etapas obrigatórias: `Novo`, `Qualificação`, `Diagnóstico`, `Proposta`, `Negociação`, `Ganho`, `Perdido`.
- `activities`: ligação, e-mail, visita, reunião, follow-up; data, status, responsável, cliente e oportunidade opcionais.
- `targets`: metas mensais por vendedor e território para receita, margem, novos clientes e conversão.

### Inteligência comercial

- `customer_scores`: cliente, score de recompras, score de risco de inatividade, score de potencial, score de prioridade, explicações e data de cálculo.
- `alerts`: tipo, severidade, título, descrição, cliente/oportunidade vinculada, recomendação, status e usuário que resolveu.
- `forecast_snapshots`: período, previsão, valor realizado quando aplicável, método e erro de previsão.

## Dados sintéticos e seed

Gere dados coerentes, determinísticos e reprodutíveis com uma seed baseada em faker com locale pt_BR e uma seed fixa.

Quantidade mínima sugerida:

- 1 organização;
- 3 usuários demo;
- 5 territórios;
- 12 famílias de produto;
- 150 produtos;
- 350 clientes distribuídos em segmentos industriais;
- 600 contatos;
- 2.500 pedidos e 5.000 itens de pedido, cobrindo 24 meses;
- 350 cotações;
- 250 oportunidades em todas as etapas;
- 700 atividades;
- metas mensais para os últimos 12 meses e próximos 3 meses.

Modele comportamentos realistas:

- determinados segmentos compram com maior recorrência;
- alguns clientes estão ativos, outros inativos e outros com queda de compra;
- descontos altos reduzem margem;
- oportunidades sem atividade recente tornam-se mais arriscadas;
- o histórico deve conter sazonalidade moderada, crescimento/queda por território e eventos aleatórios pequenos;
- deixe alguns casos de dados ausentes ou inconsistentes para testar estados de interface, mas não quebre os cálculos.

O seed deve conter um conjunto pequeno de cenários intencionais e documentados no README, por exemplo: um cliente estratégico em risco, uma oportunidade relevante sem follow-up, uma cotação com margem abaixo do alvo e uma oportunidade com alta chance de fechamento.

## Rotas e telas

### 1. Dashboard executivo (`/dashboard`)

Mostre, com filtro por período, território, segmento e vendedor:

- receita realizada versus meta;
- margem bruta versus meta;
- oportunidades abertas e valor ponderado do pipeline;
- conversão de proposta para ganho;
- novos clientes;
- clientes em risco e clientes com oportunidade de recompra;
- evolução mensal de receita, margem e pedidos;
- funil por etapa com quantidade, valor e taxa de conversão;
- ranking de territórios e vendedores;
- Pareto de clientes/produtos;
- painel de alertas prioritários;
- lista “Ações recomendadas para hoje”, com motivo e link contextual.

Não mostre gráfico pelo gráfico: cada área deve responder uma pergunta comercial. Inclua textos de apoio curtos e precisos.

### 2. Clientes (`/customers` e `/customers/[id]`)

Lista com pesquisa, filtros, paginação e colunas configuráveis. Exiba segmento, território, vendedor, última compra, receita acumulada, margem, score de prioridade e status.

Na visão 360º do cliente, inclua:

- resumo financeiro e comercial;
- tendência de compra e recorrência;
- pedidos, cotações, oportunidades e atividades;
- contatos;
- produtos/famílias mais comprados;
- score de prioridade com explicação;
- alertas e ações recomendadas;
- formulário para registrar atividade e criar oportunidade.

### 3. Pipeline (`/pipeline`)

Crie visão kanban e tabela. Permita mover oportunidade de etapa com confirmação quando for “Ganho” ou “Perdido”; perda exige motivo. Inclua filtros e um painel lateral detalhado.

Calcule automaticamente:

- valor ponderado = valor estimado × probabilidade;
- dias na etapa;
- dias sem atividade;
- risco de atraso baseado em atividade, prazo e etapa.

### 4. Oportunidades (`/opportunities/[id]`)

Linha do tempo, informações do cliente, produtos/famílias de interesse, atividades, previsão, alerta de risco, próximo passo e ações de edição. Mostre por que o sistema classifica o risco.

### 5. Cotações e pedidos (`/quotes`, `/orders`)

Tabelas com filtros, detalhes e métricas. Na cotação, calcule subtotal, desconto, custo, margem bruta e sinalize margem abaixo da meta. Não implemente fluxo financeiro real nem integração externa.

### 6. Catálogo (`/products`)

Lista de produtos, filtros por família e aplicação, detalhes de preço, custo, margem, estoque e itens mais vendidos.

### 7. Inteligência comercial (`/insights`)

Esta deve ser a página mais importante do case. Organize em quatro blocos:

- **Recompra provável**: clientes com janela histórica de recompra próxima ou vencida;
- **Risco de inatividade**: clientes relevantes com queda/ausência de compra;
- **Oportunidades em risco**: estágio parado, próximo passo vencido ou sem atividade;
- **Risco de margem**: desconto, custo ou mix que levam margem abaixo da meta.

Cada insight deve exibir score, nível de confiança/calibração quando aplicável, fatores que influenciaram o score e uma ação recomendada. Exemplo: “Cliente XPTO tem 82/100 de prioridade porque comprava a cada 45–60 dias, está há 73 dias sem pedido e pertence ao segmento com maior margem.”

### 8. Relatórios (`/reports`)

Relatórios filtráveis e exportação CSV apenas dos dados que o usuário tem permissão para ver. Inclua: carteira, receita/margem, pipeline, conversão, recompra e desempenho por território. Proteja a exportação no servidor e limite volume com paginação/limite explícito.

### 9. Configurações (`/settings`)

Perfil, metas, alertas e catálogo de motivos de perda. Admin tem edição completa; os demais papéis devem respeitar permissões.

## Regras de negócio

Implemente as regras em funções puras, com testes unitários. Não esconda cálculo relevante em componente visual.

1. Margem bruta = `(receita - custo) / receita`, com proteção para receita zero.
2. Receita ponderada do pipeline = `valor_estimado × probabilidade`.
3. Clientes de alto valor com atraso acima de sua janela normal de recompra aumentam prioridade.
4. Oportunidades sem atividade há mais de 14 dias recebem alerta de atenção; mais de 30 dias, alerta crítico. Use configuração centralizada.
5. Cotações abaixo da margem alvo da família de produto recebem alerta de margem.
6. Score de prioridade deve ser de 0 a 100 e combinar de modo documentado: potencial de receita, margem, risco de inatividade, proximidade de recompra e oportunidade aberta. Deixe pesos centralizados e fáceis de ajustar.
7. Score e alertas devem poder ser recalculados por endpoint/Server Action protegido; também implemente uma rota de cron protegida por segredo de ambiente, documentada para agendamento na Vercel.
8. Toda edição relevante deve gerar evento de auditoria simples: quem, quando, entidade e ação. Não registre dados sensíveis desnecessários.

## ML e previsão: realista, explicável e opcionalmente evolutivo

Não finja que um modelo treinado em dados sintéticos é uma previsão de produção. O sistema deve informar que os resultados são demonstrativos.

### Camada inicial obrigatória

Crie uma camada analítica determinística e testada, sem depender de API de IA:

- cálculo de RFM (recência, frequência, valor monetário);
- classificação de risco de inatividade usando regras e normalização;
- propensão de recompra baseada em intervalo histórico, recência e frequência;
- score de oportunidade baseado em estágio, atividade, prazo e histórico do cliente;
- previsão mensal simples por média móvel ponderada ou suavização exponencial;
- explicação local dos fatores de cada score.

### Camada avançada opcional, mas implemente se couber sem comprometer a qualidade

Inclua um script offline em Python em `ml/` para treinar um modelo simples e explicável com o dataset sintético, por exemplo `scikit-learn` Logistic Regression ou Random Forest para probabilidade de recompra/inatividade. O script deve:

- gerar features documentadas;
- separar treino/teste por tempo quando possível;
- registrar métricas básicas e limitações;
- exportar previsões para CSV/JSON que possam ser importadas para `customer_scores`;
- nunca ser executado a cada request da aplicação;
- ter README específico explicando como executar localmente.

Se a camada Python tornar o deploy Vercel inadequado, mantenha o treinamento offline e a aplicação apenas consome resultados importados. A camada determinística deve continuar funcionando sem o script Python.

Não use API de LLM como substituta dos cálculos. Se criar um resumo narrativo de insights, ele deve ser derivado de templates e números reais do banco; não envie dados a serviços externos.

## Segurança e qualidade

- RLS em todas as tabelas de negócio.
- Política por organização e role.
- Server Actions e API routes com validação Zod, autenticação e autorização.
- Rate limiting simples/documentado para endpoints mutáveis e exportação, se houver infraestrutura disponível; caso não haja, escreva uma abstração e documente o ponto de integração.
- Nunca retorne colunas de custo/margem detalhada para `seller`.
- Não registre chaves, senhas, tokens ou dados pessoais em logs.
- Tratamento de erros com mensagens úteis para o usuário e logs seguros no servidor.
- Estados de loading, empty e error em cada consulta assíncrona importante.
- Sanitização/validação de inputs.
- Nenhum segredo no repositório.

## Estrutura de código esperada

Organize o código para que a regra de domínio não dependa da interface. Uma referência possível:

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  dashboard/
  customers/
  pipeline/
  insights/
  ui/
features/
  customers/
  opportunities/
  forecasting/
  scoring/
lib/
  auth/
  supabase/
  permissions/
  validations/
  formatters/
  analytics/
db/
  migrations/
  seed/
  queries/
ml/
tests/
```

Evite arquivos gigantes. Componentes de visualização não devem consultar o banco diretamente se isso reduzir testabilidade. Centralize constantes de etapas, severidades, papéis, metas e pesos de score.

## Critérios de aceite

Considere o trabalho concluído somente quando todos os itens abaixo forem verdadeiros:

- `npm run lint` passa;
- `npm run typecheck` passa;
- testes unitários das regras de margem, pipeline, alertas e score passam;
- ao menos um teste Playwright cobre login demo → dashboard → abrir um cliente → criar uma atividade;
- migrations e seed são reproduzíveis em banco limpo;
- usuário demo consegue navegar em todas as telas principais;
- RBAC/RLS impede `seller` de acessar dados detalhados de custo e margem;
- dashboard, clientes, pipeline, insights e relatórios exibem dados e filtros funcionando;
- CSV exportado respeita escopo de permissão;
- não há links quebrados, telas “em breve” ou botões sem ação;
- README contém uma checklist de deploy na Vercel e configuração do Supabase;
- o projeto declara claramente que os dados e previsões são demonstrativos e sintéticos.

## Entrega final do Cursor

Ao finalizar, mostre:

1. árvore de arquivos criada;
2. decisões de arquitetura importantes;
3. comandos exatos para instalar, configurar Supabase, aplicar migrations, rodar seed, testar e publicar;
4. variáveis de ambiente necessárias;
5. credenciais demo criadas pelo seed;
6. funcionalidades concluídas e limitações honestas;
7. sugestões de melhorias futuras, separadas do que já está implementado.

Comece agora apresentando o plano curto e, em seguida, implemente o sistema completo.

---
