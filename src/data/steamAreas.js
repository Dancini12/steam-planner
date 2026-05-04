// ============================================================
// steamAreas.js
// As cinco áreas STEAM com suas identidades visuais
// ============================================================
//
// STEAM = Science, Technology, Engineering, Arts, Mathematics
// Conforme proposto por Yakman (2008), a metodologia STEAM
// integra as áreas tradicionalmente separadas do conhecimento
// num projeto único, refletindo a forma como problemas reais
// se apresentam: interdisciplinares e complexos.
//
// As cores escolhidas seguem a paleta neon que dialoga com
// a identidade visual contemporânea da educação tecnológica.
// ============================================================

export const STEAM_AREAS = {
  S: {
    letter: "S",
    name: "Ciência",
    nameEn: "Science",
    color: "#3FD64C",
    description:
      "Investigação dos fenômenos naturais por método científico. Inclui Biologia, Química, Física, Geociências."
  },
  T: {
    letter: "T",
    name: "Tecnologia",
    nameEn: "Technology",
    color: "#3B95F2",
    description:
      "Uso e desenvolvimento de ferramentas digitais e analógicas para resolver problemas. Inclui programação, eletrônica, mídias digitais."
  },
  E: {
    letter: "E",
    name: "Engenharia",
    nameEn: "Engineering",
    color: "#FF8C1A",
    description:
      "Aplicação prática do conhecimento para construir soluções. Envolve design, prototipagem, testes e iteração."
  },
  A: {
    letter: "A",
    name: "Arte",
    nameEn: "Arts",
    color: "#E8358A",
    description:
      "Expressão criativa e estética. Inclui artes visuais, música, performance, design e comunicação."
  },
  M: {
    letter: "M",
    name: "Matemática",
    nameEn: "Mathematics",
    color: "#A050F0",
    description:
      "Linguagem do raciocínio quantitativo e abstrato. Inclui álgebra, geometria, estatística, lógica."
  }
};

// Lista das letras na ordem do acrônimo (útil para iterações).
export const STEAM_KEYS = ["S", "T", "E", "A", "M"];

// Função auxiliar: pega cor de uma área pela letra.
export function getAreaColor(letter) {
  return STEAM_AREAS[letter]?.color || "#888";
}

// Função auxiliar: pega nome de uma área pela letra.
export function getAreaName(letter) {
  return STEAM_AREAS[letter]?.name || letter;
}
