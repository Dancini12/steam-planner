// ============================================================
// aiGenerator.js
// Geração de projetos STEAM usando camada centralizada de providers de IA
// ============================================================

import { STEAM_AREAS } from "../data/steamAreas.js";
import { AIProviderManager } from "./ai/AIProviderManager.js";

function buildPrompt(theme, grade, steamAreas) {
  const areasNames = steamAreas
    .map((letter) => `${letter} (${STEAM_AREAS[letter].name})`)
    .join(", ");

  const hasArt = steamAreas.includes("A");
  const phaseDetailLevel = hasArt ? "descrição concisa mas operacional" : "descrição detalhada e operacional";

  return `Você é especialista em educação STEAM e BNCC para Ensino Fundamental II brasileiro.

Crie um projeto educacional STEAM seguindo estes parâmetros:

- Tema: ${theme}
- Ano: ${grade}
- Áreas STEAM: ${areasNames}

Diretrizes:
1. Projeto realista para escolas públicas brasileiras (materiais acessíveis)
2. Questão norteadora aberta e investigativa
3. Objetivos mensuráveis adequados ao ano
4. BNCC reais (códigos como EFXXMA01, EFXXCI03)
5. Cultura Maker obrigatória em todas as etapas, com mão na massa, prototipagem e iteração
6. Matriz STEAM com contribuição, atividade e evidência para cada área selecionada
7. 5 fases: Imersão, Ideação, Prototipagem, Teste, Compartilhamento
8. Cada fase com ${phaseDetailLevel}, atividades concretas
9. Formato pronto para impressão: cada atividade em nova página, seções claras e layout sequencial
10. 5 a 8 referências bibliográficas em formato ABNT sobre o tema

Responda APENAS com JSON válido:

{
  "title": "Título envolvente",
  "theme": "Subtítulo curto",
  "duration": "X semanas · Y aulas",
  "problem": "Problema ou desafio real que mobiliza o projeto",
  "guidingQuestion": "Pergunta aberta provocadora?",
  "steamMatrix": {
    "S": {
      "contribution": "Contribuição da área para o projeto",
      "activity": "Atividade relacionada",
      "evidence": "Evidência esperada"
    }
  },
  "objectives": ["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"],
  "bncc": ["EF0XCI01", "EF0XMA02", "EF0XLP03"],
  "materials": ["Material 1", "Material 2", "Material 3", "Material 4", "Material 5"],
  "phaseDetails": {
    "imersao": "Descrição da fase Imersão",
    "ideacao": "Descrição da fase Ideação",
    "prototipagem": "Descrição da fase Prototipagem",
    "teste": "Descrição da fase Teste",
    "compartilhamento": "Descrição da fase Compartilhamento"
  },
  "bibliography": ["AUTOR, A. Título do livro. Editora, ano."]
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
  const requiredFields = [
    "title",
    "theme",
    "duration",
    "problem",
    "guidingQuestion",
    "steamMatrix",
    "objectives",
    "bncc",
    "materials",
    "phaseDetails"
  ];

  const requiredPhases = [
    "imersao",
    "ideacao",
    "prototipagem",
    "teste",
    "compartilhamento"
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Campo obrigatório ausente na resposta: ${field}`);
    }
  }

  if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
    throw new Error("O campo objectives deve ser um array não vazio.");
  }

  if (typeof data.steamMatrix !== "object" || data.steamMatrix === null) {
    throw new Error("O campo steamMatrix deve ser um objeto.");
  }

  if (!Array.isArray(data.bncc) || data.bncc.length === 0) {
    throw new Error("O campo bncc deve ser um array não vazio.");
  }

  if (!Array.isArray(data.materials) || data.materials.length === 0) {
    throw new Error("O campo materials deve ser um array não vazio.");
  }

  if (typeof data.phaseDetails !== "object" || data.phaseDetails === null) {
    throw new Error("O campo phaseDetails deve ser um objeto.");
  }

  for (const phase of requiredPhases) {
    if (!data.phaseDetails[phase]) {
      throw new Error(`Detalhamento ausente para a fase: ${phase}`);
    }
  }

  if (!data.bibliography) {
    data.bibliography = [];
  }

  if (!Array.isArray(data.bibliography)) {
    throw new Error("O campo bibliography deve ser um array.");
  }

  return true;
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

  const prompt = buildPrompt(theme, grade, steamAreas);

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
    const projectData = JSON.parse(cleaned);

    validateProjectStructure(projectData);
    projectData.grade = grade;
    projectData.steam = steamAreas;

    return projectData;
  } catch (parseError) {
    throw new Error(`Erro ao processar resposta da IA: ${parseError.message}`);
  }
}
