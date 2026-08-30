# Da ideia à atividade pronta — como o STEAM Planner funciona, passo a passo

Este documento explica, em linguagem simples, a jornada completa que o sistema percorre desde a escolha do
professor até o PDF impresso em sala de aula. Serve como ponto de partida para escrever o capítulo de
metodologia/arquitetura do artigo. Para o detalhamento técnico (diagramas UML, schema do banco, código
exato), ver `01-diagramas-uml.html` na mesma pasta.

Para deixar tudo concreto, os 9 passos abaixo seguem um exemplo real gerado pelo próprio sistema: uma
atividade de Matemática para o 8º ano sobre padrões visuais e expressões algébricas ("Padrões Visuais em
Movimento: O Robô Desenhista").

---

## 1. O professor define o que quer ensinar

Ele abre o planejador pedagógico e preenche um formulário curto: disciplina (Matemática), ano/série (8º
ano), o tema livre em uma frase ("padrões visuais e sequências algébricas"), quantas aulas tem disponível,
se o trabalho é individual ou em grupo, e quais competências STEAM (Ciência, Tecnologia, Engenharia, Arte,
Matemática) ele quer priorizar. Não precisa escrever objetivo, problema ou plano de aula — só a intenção.

## 2. O sistema mostra o que vai ser trabalhado, antes mesmo de acionar a IA

Antes de gerar qualquer coisa, o sistema já consulta sozinho, por regra (sem IA), a base oficial da BNCC e
mostra as habilidades reais que serão trabalhadas — código e descrição, ex: `EF08MA01` — "Efetuar cálculos
com potências de expoentes inteiros...". Essa seleção nunca é feita pela IA; é uma busca determinística na
base curricular completa da BNCC, cruzando série, disciplina, tema e competências STEAM escolhidas. Isso
evita que uma habilidade "inventada" apareça mais tarde.

## 3. O sistema monta um briefing rico para a IA

Antes de escrever o prompt, o sistema reúne automaticamente: as habilidades BNCC já selecionadas, fontes
acadêmicas confiáveis sobre o tema (busca em bases externas + conhecimento já validado internamente), e os
"padrões de qualidade" aprendidos com o histórico do próprio professor — que tipos de atividade, disciplina,
série e materiais ele avaliou bem no passado. Tudo isso vira contexto escrito dentro do prompt.

## 4. A IA generativa escreve o primeiro rascunho

Esse briefing completo é enviado para um modelo de IA generativa (Google Gemini é o principal; se ele falhar
ou devolver algo inválido, o sistema aciona automaticamente um modelo reserva, Cerebras, sem o professor
perceber). A IA devolve a atividade inteira, já estruturada: título, objetivo, problema/desafio, missão,
materiais, etapas de montagem, desafio maker, produto final, conexão com cada letra do STEAM, critérios de
avaliação, referências e o gabarito do professor.

## 5. Nada do que a IA escreveu é aceito de olhos fechados

O sistema confere automaticamente, com regras determinísticas, se: os códigos BNCC citados existem mesmo
na base oficial; as frases não ficaram cortadas pela metade; quando o tema envolve dinheiro (educação
financeira), as contas realmente fecham; as referências bibliográficas têm formato correto (DOI válido,
nunca Wikipédia). Se encontra um erro, o sistema tenta se corrigir sozinho (até três tentativas) antes de
mostrar qualquer coisa ao professor — e só bloqueia a exportação se não conseguir corrigir.

## 6. Aqui está o núcleo da metodologia STEAM + Cultura Maker

A atividade não é gerada como uma lista solta de exercícios. Toda atividade — qualquer tema, qualquer
disciplina — é organizada dentro de um ciclo fixo de 6 etapas, definido no próprio código da aplicação (não
pela IA):

1. **Preparar a base e dividir materiais**
2. **Construir as partes principais**
3. **Criar o mecanismo de interação**
4. **Testar com situação real**
5. **Ajustar e testar novamente**
6. **Apresentar produto e evidências**

No exemplo do robô desenhista: os alunos recebem placa de MDF, elásticos e alfinetes (etapa 1), montam o
mecanismo (etapa 2), criam a forma de desenhar o padrão (etapa 3), testam com dois cenários matemáticos
concretos — sequência linear e padrão geométrico — registrando os resultados numa "Tabela de Teste" (etapa
4), ajustam o que não funcionou e testam de novo (etapa 5), e apresentam o protótipo final com a expressão
algébrica encontrada (etapa 6). Esse é o ciclo **investigar → construir → testar → melhorar → apresentar**
que caracteriza a Cultura Maker, e ele é obrigatório em toda atividade — é estrutura do sistema, não
sugestão da IA.

## 7. O professor revisa e pode ajustar

A atividade aparece na tela para leitura e edição de qualquer campo. O professor também pode avaliar com
👍/👎 — essa nota não é só um registro: ela realimenta o passo 3 na próxima geração, ou seja, o sistema
"aprende" (por contagem de frequência, não por um modelo estatístico) que tipo de atividade esse professor
específico considerou boa.

## 8. Exportação para a sala de aula

Ao exportar, o sistema monta um documento HTML formatado como material impresso: seções numeradas
(objetivo, problema, materiais em tabela, as 6 etapas lado a lado, tabela de teste em branco para o aluno
preencher, avaliação, referências) e, em página separada, um **gabarito exclusivo do professor** — que nunca
aparece na versão do aluno.

## 9. O material final vira PDF

O navegador abre esse documento pronto para impressão. O professor usa "Salvar como PDF" (ou imprime
direto) — é isso que chega fisicamente à sala de aula.

---

## Por que isso importa para o artigo

- **A IA gera conteúdo, mas não decide o que é curricularmente válido.** Toda validação factual (BNCC,
  matemática financeira, referências) é feita por código determinístico, não pela IA — ponto forte para
  discutir mitigação de alucinação em sistemas educacionais com IA generativa.
- **A metodologia STEAM + Cultura Maker não é um "tema" da atividade, é a estrutura obrigatória do
  documento.** O ciclo de 6 etapas (investigar–construir–testar–melhorar–apresentar) é fixo no código,
  independente da disciplina ou do que a IA escreve.
- **O sistema tem memória de qualidade por professor**, via avaliações 👍/👎, mas isso é contagem de
  frequência simples — vale nomear com precisão no artigo (não é um modelo de aprendizado de máquina
  treinado).
