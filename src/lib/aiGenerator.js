// ============================================================
// aiGenerator.js
// Geração de projetos STEAM usando camada centralizada de providers de IA
// ============================================================

import { STEAM_AREAS } from "../data/steamAreas.js";
import { AIProviderManager } from "./ai/AIProviderManager.js";
import {
  formatBnccSuggestions,
  getBnccCodes,
  normalizeBnccCodes,
  selectBnccHabilidades
} from "./bnccSelector.js";
import {
  getLearningExperienceStageTitles,
  normalizeLearningExperience,
  validateLearningExperience
} from "./learningExperience.js";

function buildPrompt(theme, grade, steamAreas, bnccSuggestions) {
  const areasNames = steamAreas
    .map((letter) => `${letter} (${STEAM_AREAS[letter].name})`)
    .join(", ");
  const stageTitles = getLearningExperienceStageTitles()
    .map((title) => `- ${title}`)
    .join("\n");

  return `Você é especialista em educação STEAM e BNCC para Ensino Fundamental II brasileiro.

Crie uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER seguindo estes parâmetros:

- Tema: ${theme}
- Ano: ${grade}
- Áreas STEAM: ${areasNames}
- Habilidades BNCC selecionadas do banco offline:
${formatBnccSuggestions(bnccSuggestions)}

Regras obrigatórias:
1. Nascer de problema real, desafio investigativo, missão, construção/prototipagem, teste e melhoria.
2. Máximo de 2 páginas A4, com texto compacto e aplicação imediata.
3. Não gerar apostila, fundamentação acadêmica, matriz STEAM, Design Thinking, material do aluno, vocabulário ou anexos.
4. Use no campo "bncc" apenas códigos da lista BNCC offline fornecida acima; não invente códigos.
5. Materiais acessíveis, máximo 6 itens com quantidade por grupo.
6. Desenvolvimento e montagem com exatamente estas etapas:
${stageTitles}
7. Explique como preparar base, dividir materiais, construir, interagir, testar, ajustar e apresentar.
8. Gere "readyMaterials" com cenários, fichas, cartões, tabela de teste, perguntas ou dados citados.
9. Evite frases genéricas como "faça um protótipo", "use os materiais disponíveis" ou "teste a solução" sem explicar como.
10. Crie 2 testes concretos: um cenário esperado e outro com imprevisto, restrição ou falha.
11. Avaliação em mini rubrica: "criterion" e "observation".
12. Referências reais em formato ABNT. Se não tiver fonte específica, use a BNCC. Não use reticências.
13. Nunca escreva "Pós-its" ou "Post-its". Use sempre "notas adesivas".
14. Inclua "steamConnection" com 1 frase curta por área (Ciência, Tecnologia, Engenharia, Arte, Matemática).
15. Inclua "teacherGabarito": resultados esperados de cada cenário, 1 frase curta por item com valores, saldo ou conclusão objetiva.

Responda APENAS com JSON válido:

{
  "title": "Título curto da experiência",
  "theme": "${theme}",
  "duration": "1 a 2 aulas",
  "objective": "Objetivo geral curto.",
  "problem": "Problema real que inicia a experiência.",
  "mission": "Sua equipe deverá desenvolver uma solução prática para o problema.",
  "bncc": ${JSON.stringify(getBnccCodes(bnccSuggestions))},
  "materials": ["Material 1 - quantidade por grupo", "Material 2 - quantidade por grupo"],
  "materialFunctions": ["Material 1: função prática no protótipo.", "Material 2: função prática no mecanismo, teste ou registro."],
  "readyMaterials": [
    "CENÁRIO 1 - Funcionamento esperado: situação, dados e pergunta para testar.",
    "CENÁRIO 2 - Imprevisto: restrição, falha ou mudança para comparar.",
    "TABELA DE TESTE - Critério | Resultado antes | Falha observada | Melhoria feita | Resultado depois."
  ],
  "stages": [
    { "number": 1, "title": "ETAPA 1 - Preparar a base e dividir materiais", "description": "Divida a base em problema, solução, teste e melhoria. Separe peças móveis e registro." },
    { "number": 2, "title": "ETAPA 2 - Construir as partes principais", "description": "Monte as peças centrais e explique a função de cada material no protótipo." },
    { "number": 3, "title": "ETAPA 3 - Criar o mecanismo de interação", "description": "Crie cartões, fichas, abas, setas, encaixes ou simulação manipulável." },
    { "number": 4, "title": "ETAPA 4 - Testar com situação real", "description": "Aplique dois cenários prontos. Meça resultado, compare e registre falhas." },
    { "number": 5, "title": "ETAPA 5 - Ajustar e testar novamente", "description": "Mude uma falha concreta, repita o teste e registre o antes e depois." },
    { "number": 6, "title": "ETAPA 6 - Apresentar produto e evidências", "description": "Apresente protótipo, cenário testado, melhoria feita e evidência observada." }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessmentRubric": [
    { "criterion": "Protótipo", "observation": "Representa o problema e pode ser testado?" },
    { "criterion": "Teste", "observation": "O grupo aplicou o cenário e registrou resultado?" },
    { "criterion": "Melhoria", "observation": "O grupo ajustou o protótipo após identificar falha?" },
    { "criterion": "Comunicação", "observation": "O grupo explicou solução, teste e melhoria?" }
  ],
  "bibliography": ["BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018."],
  "steamConnection": {
    "science": "conceito ou fenômeno investigado na atividade.",
    "technology": "recurso, ferramenta ou sistema utilizado.",
    "engineering": "o que será construído, testado e melhorado.",
    "art": "elemento visual, criativo ou comunicativo do protótipo.",
    "mathematics": "cálculos, medidas ou comparação de dados."
  },
  "teacherGabarito": [
    "Cenário 1: resultado esperado com valores ou conclusão objetiva.",
    "Cenário 2: resultado do imprevisto com impacto observado."
  ]
}`;
}

function cleanJsonResponse(text) {
  if (typeof text !== "string") {
    throw new Error("Texto da resposta inesperado. Não foi possível extrair JSON.");
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/```(?:json)?/gi, "").trim();

  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error(
      `Nenhum objeto JSON encontrado na resposta. Texto recebido: ${cleaned.slice(0, 200)}`
    );
  }

  let braceCount = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      braceCount += 1;
    }

    if (char === "}") {
      braceCount -= 1;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    const partial = cleaned.slice(start);
    const repairBraceCount = braceCount;
    if (repairBraceCount > 0) {
      const repaired = `${partial}${"}".repeat(repairBraceCount)}`;
      try {
        JSON.parse(repaired);
        return repaired.trim();
      } catch (repairError) {
        // continue to throw original error below
      }
    }

    throw new Error(
      `Resposta JSON incompleta ou inválida. Texto recebido: ${partial.slice(0, 200)}`
    );
  }

  return cleaned.slice(start, endIndex + 1).trim();
}

function getGeneratedText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return undefined;
  }

  if (typeof candidate.content === "string") {
    return candidate.content;
  }

  if (typeof candidate.content?.text === "string") {
    return candidate.content.text;
  }

  if (Array.isArray(candidate.content?.parts)) {
    return candidate.content.parts
      .map((part) => part?.text || (typeof part?.content?.text === "string" ? part.content.text : ""))
      .filter(Boolean)
      .join("");
  }

  return undefined;
}

function validateProjectStructure(data) {
  const validation = validateLearningExperience(data);
  if (!validation.valid) {
    throw new Error(`Experiência STEAM + Maker incompleta: ${validation.missing.join(", ")}`);
  }

  if (!Array.isArray(data.bncc) || data.bncc.length === 0) {
    throw new Error("O campo bncc deve ser um array não vazio.");
  }

  if (!Array.isArray(data.materials) || data.materials.length === 0) {
    throw new Error("O campo materials deve ser um array não vazio.");
  }

  if (!data.bibliography) {
    data.bibliography = [];
  }

  if (!Array.isArray(data.bibliography)) {
    throw new Error("O campo bibliography deve ser um array.");
  }

  return true;
}

function buildSteamMatrix(steamAreas = []) {
  return steamAreas.reduce((acc, letter) => {
    acc[letter] = {
      contribution: "Investigação, construção, teste e melhoria aplicados ao desafio.",
      activity: "Ação prática integrada ao protótipo.",
      evidence: "Registro do protótipo, teste e melhoria."
    };
    return acc;
  }, {});
}

function applyOfflineBncc(data, bnccSuggestions) {
  const offlineCodes = getBnccCodes(bnccSuggestions);
  if (offlineCodes.length === 0) {
    return {
      ...data,
      bncc: Array.isArray(data.bncc) ? normalizeBnccCodes(data.bncc) : []
    };
  }

  const selectedCodes = Array.isArray(data.bncc)
    ? normalizeBnccCodes(data.bncc).filter((code) => offlineCodes.includes(code))
    : [];

  return {
    ...data,
    bncc: selectedCodes.length > 0 ? selectedCodes : offlineCodes.slice(0, 3)
  };
}

export async function generateBibliographyWithAI({ title, theme, grade, steamAreas }) {
  const areasNames = (steamAreas || [])
    .map((letter) => STEAM_AREAS[letter]?.name || letter)
    .join(", ");

  const prompt = `Você é especialista em educação STEAM e pesquisa acadêmica brasileira.

Gere de 6 a 8 referências bibliográficas em formato ABNT para um projeto escolar com as seguintes características:

- Título: ${title || "Projeto STEAM"}
- Tema: ${theme || "educação STEAM"}
- Ano escolar: ${grade || "Ensino Fundamental II"}
- Áreas STEAM: ${areasNames || "todas as áreas"}

As referências devem:
1. Ser obras reais e existentes (livros, artigos, documentos oficiais)
2. Ser relevantes para o tema e faixa etária
3. Incluir obras sobre metodologia STEAM/BNCC quando pertinente
4. Estar em formato ABNT correto

Responda APENAS com um array JSON válido de strings, sem texto adicional:
["Referência 1 em ABNT", "Referência 2 em ABNT"]`;

  const response = await AIProviderManager.request({
    requestType: 'bibliography',
    prompt
  });

  const generatedText = response.content;

  if (!generatedText) {
    throw new Error("A IA não retornou conteúdo.");
  }

  const cleaned = cleanJsonResponse(generatedText);

  const startArr = cleaned.indexOf("[");
  const endArr = cleaned.lastIndexOf("]");
  if (startArr === -1 || endArr === -1) {
    throw new Error("A IA não retornou um array de referências válido.");
  }

  const refs = JSON.parse(cleaned.slice(startArr, endArr + 1));

  if (!Array.isArray(refs) || refs.length === 0) {
    throw new Error("A IA retornou uma lista vazia de referências.");
  }

  return refs;
}

export async function generateProjectWithAI({ theme, grade, steamAreas }) {
  if (!theme || theme.trim().length < 3) {
    throw new Error("O tema é muito curto. Descreva melhor o que deseja.");
  }

  if (!steamAreas || !Array.isArray(steamAreas) || steamAreas.length === 0) {
    throw new Error("Selecione ao menos uma área STEAM.");
  }

  const bnccSuggestions = selectBnccHabilidades({
    grade,
    theme,
    steamAreas,
    limit: 5
  });

  const prompt = buildPrompt(theme, grade, steamAreas, bnccSuggestions);

  const response = await AIProviderManager.request({
    requestType: 'project',
    prompt
  })

  let generatedText = response.content

  if (!generatedText || typeof generatedText !== "string") {
    throw new Error("A IA não retornou conteúdo extraível. Verifique se a resposta está válida.");
  }

  try {
    const cleaned = cleanJsonResponse(generatedText);
    const projectData = normalizeLearningExperience(
      applyOfflineBncc(JSON.parse(cleaned), bnccSuggestions),
      { theme, grade }
    );

    validateProjectStructure(projectData);
    projectData.grade = grade;
    projectData.steam = steamAreas;
    projectData.steamMatrix = projectData.steamMatrix || buildSteamMatrix(steamAreas);
    projectData.generatedAt = new Date().toISOString();

    return projectData;
  } catch (parseError) {
    throw new Error(`Erro ao processar resposta da IA: ${parseError.message}`);
  }
}
