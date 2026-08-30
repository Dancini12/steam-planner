# Estrutura e Fluxos do STEAM Planner (frontend)

## Roteamento
`src/main.jsx` monta `<App/>` num `RootErrorBoundary`. NÃO há react-router — navegação por estado local em `App.jsx` via objeto `SCREENS` e estado `currentScreen`, trocado por callbacks `goTo*()`. `App.jsx` guarda `activeProjectId`, `activePhaseId`, `activeActivityResult`, controla sessão Supabase, renderiza `<Login>` se não autenticado.

## Páginas (src/pages/)
- Login.jsx — autenticação
- Dashboard.jsx — tela inicial: lista projetos, inicia geração via IA, acesso a Biblioteca/BNCC/Notícias, painel de feedbacks (admin)
- Library.jsx — biblioteca de templates STEAM prontos
- ProjectEditor.jsx — edição central do projeto (dados gerais, BNCC, exportação)
- PhaseEditor.jsx — edição de uma das 5 fases: cabeçalho didático, plano pedagógico, diário de bordo, Avaliação em Fases (núcleo da pesquisa)
- BibliographyEditor.jsx — referências bibliográficas
- ActivityViewer.jsx — visualização/impressão da atividade gerada por IA
- BNCC.jsx — consulta offline de habilidades BNCC
- RealWorldNews.jsx — notícias para inspiração pedagógica
- Settings.jsx — status dos provedores de IA

## Autenticação
Supabase Auth. Login.jsx: `signInWithPassword`/`signUp` com tratamento de erros + `registerUserProfile`. App.jsx restaura sessão (`getSession`) e escuta `onAuthStateChange`. Toda a aplicação exige autenticação (exceto Login). Logout em App.jsx.

## Componentes principais
- **project/**: AIGeneratorModal, PedagogicalPlannerModal, CreationTipsModal, FeedbackModal, BibliographySection/BibliographyVerifier, ProjectCard, ProgressBar, SteamBadges
- **phase/**: PhaseHeader, DiaryEntryForm/DiaryEntry, EvaluationForm (Avaliação em Fases)
- **ui/**: Button, Card, Modal, TextField, CookieBanner

Suporte de negócio (não-UI): useProjects.js (CRUD), lib/ai/* (AIProviderManager, PedagogicalPlannerService), lib/machine-learning/*, lib/exportReport.js, lib/bnccSelector.js, lib/analytics.js.

## Casos de uso (fluxos do professor)
1. Cadastrar-se / Entrar — Login.jsx
2. Criar projeto via IA — Dashboard → AIGeneratorModal → ProjectEditor
3. Gerar atividade/planejamento pedagógico com IA — Dashboard → PedagogicalPlannerModal → ActivityViewer
4. Usar projeto da Biblioteca — Library → cópia editável → ProjectEditor
5. Editar projeto e dados BNCC — ProjectEditor
6. Planejar/registrar/avaliar uma fase — PhaseEditor (DiaryEntryForm, EvaluationForm)
7. Gerenciar bibliografia — BibliographyEditor (+ BibliographyVerifier)
8. Exportar relatório/atividade (PDF/impressão) — ProjectEditor/ActivityViewer (openReportWindow, openClassroomActivityWindow, openActivityPrintWindow)
9. Consultar BNCC offline — BNCC.jsx
10. Consultar notícias — RealWorldNews.jsx
11. Enviar feedback — FeedbackModal
12. Ver dicas de criação STEAM/Maker — CreationTipsModal
13. Configurar provedores de IA — Settings.jsx
14. (Admin) Consultar feedbacks recebidos — Dashboard (condicional a app_admins)

## Painel administrativo
Não é uma rota/SPA separada — é um recurso condicional dentro do Dashboard.jsx. Verificação via tabela `app_admins` (ou VITE_ADMIN_EMAIL). Se admin, mostra botão que abre modal de feedbacks (edge function `feedback`, action "list"). Migrations RLS preparam leitura ampla de app_profiles/projects/app_usage_events/app_metric_snapshots para admin, mas essas tabelas de métricas NÃO são consumidas em nenhuma tela atual do frontend — infraestrutura pronta para uso futuro (ex.: painel externo).
