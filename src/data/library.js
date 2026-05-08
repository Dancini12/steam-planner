// ============================================================
// library.js
// Biblioteca de projetos STEAM prontos para o Ensino Fundamental II
// ============================================================
//
// Este arquivo contém 16 projetos completos que servem como ponto
// de partida para o professor. Cada projeto pode ser usado como
// está ou adaptado à realidade da turma e da escola.
//
// Critérios de seleção dos projetos:
// - Cobertura das cinco áreas STEAM em diferentes combinações
// - Cobertura das disciplinas do Ensino Fundamental II (BNCC)
// - Adequação ao 6º ao 9º ano
// - Diversidade de custos e materiais (do reciclado ao Arduino)
// - Conexão explícita com a BNCC
// - Viabilidade de execução em escolas públicas brasileiras
// - Diversidade de temas: ambiental, tecnológico, social, cultural,
//   linguístico, histórico, artístico, esportivo
// - 1 projeto interdisciplinar ambicioso integrando todas as áreas
// ============================================================

const REF_BNCC =
  "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.";

const REF_UNESCO_ESD =
  "UNESCO. Education for sustainable development: a roadmap. Paris: UNESCO, 2020. Disponível em: https://unesdoc.unesco.org/ark:/48223/pf0000374802.";

const REF_NASA_CLIMATE =
  "NASA. Earth's vital signs. Washington, DC: National Aeronautics and Space Administration. Disponível em: https://www.nasa.gov/earth/climate-change/vital-signs/.";

const REF_UNESCO_MIL =
  "UNESCO. Media and information literacy curriculum for educators and learners. 2. ed. Paris: UNESCO, 2021. Disponível em: https://www.unesco.org/mil4teachers/en/curriculum.";

const REF_UNICEF_AI =
  "UNICEF. Policy guidance on AI for children. Version 2.0. New York: UNICEF, 2021. Disponível em: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children.";

const REF_WHO_ACTIVITY =
  "WORLD HEALTH ORGANIZATION. WHO guidelines on physical activity and sedentary behaviour. Geneva: WHO, 2020. Disponível em: https://www.who.int/publications/i/item/9789240015128.";

const REF_IBGE_CARTOGRAPHY =
  "IBGE. Noções básicas de cartografia. Rio de Janeiro: IBGE, 1999.";

const REF_IBGE_TABLES =
  "IBGE. Normas de apresentação tabular. 3. ed. Rio de Janeiro: IBGE, 1993.";

function createProjectPhases(context) {
  return {
    imersao:
      `Levantamento de conhecimentos prévios e análise de exemplos reais sobre ${context}. A turma registra dúvidas, hipóteses e situações do cotidiano escolar que podem orientar a investigação.`,
    ideacao:
      `Pesquisa guiada em fontes confiáveis, seleção do recorte do problema e planejamento da solução ou produto relacionado a ${context}. As equipes definem papéis, critérios de sucesso e forma de registro.`,
    prototipagem:
      `Construção de protótipos, materiais de comunicação, experimentos ou bases de dados sobre ${context}, com registros no diário de bordo e acompanhamento do professor.`,
    teste:
      `Validação com colegas ou público escolar, comparação dos resultados com os critérios definidos e revisão dos materiais a partir das evidências coletadas.`,
    compartilhamento:
      `Socialização em mostra, mural, relatório, oficina ou apresentação pública, destacando aprendizagens, limites do projeto e possibilidades de continuidade na escola.`
  };
}

export const LIBRARY = [
  // ----------------------------------------------------------
  // PROJETO 1 — Estação Meteorológica Inteligente
  // ----------------------------------------------------------
  {
    id: "lib-estacao-meteorologica",
    title: "Estação Meteorológica Inteligente",
    theme: "Clima, sensores e ciência de dados",
    grade: "7º e 8º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como podemos medir, registrar e analisar as condições climáticas da nossa escola utilizando sensores eletrônicos?",
    objectives: [
      "Compreender variáveis atmosféricas e suas inter-relações",
      "Construir circuitos eletrônicos com microcontrolador",
      "Coletar, organizar e interpretar dados numéricos",
      "Relacionar medições com fenômenos meteorológicos locais"
    ],
    bncc: ["EF07CI12", "EF07CI13", "EF08CI15", "EF07MA35", "EF08MA23"],
    materials: [
      "Arduino Uno (1 por grupo)",
      "Sensor DHT11 (temperatura e umidade)",
      "Sensor BMP180 (pressão atmosférica)",
      "Display LCD 16x2 com módulo I2C",
      "Protoboard, jumpers e resistores",
      "Computador com Arduino IDE instalado"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "INSTITUTO NACIONAL DE METEOROLOGIA. Manual de observações meteorológicas. Brasília: INMET, 1999.",
      "MONK, Simon. Programação com Arduino: começando com sketches. Porto Alegre: Bookman, 2017.",
      "BANZI, Massimo; SHILOH, Michael. Primeiros passos com Arduino. São Paulo: Novatec, 2015."
    ],
    phaseDetails: {
      imersao:
        "Roda de conversa sobre fenômenos climáticos observáveis no cotidiano dos estudantes. Análise comparativa de previsões do tempo de diferentes serviços (Climatempo, Inmet, AccuWeather). Levantamento da questão central: por que diferentes sites mostram valores diferentes para a mesma cidade?",
      ideacao:
        "Pesquisa sobre as variáveis atmosféricas relevantes (temperatura, umidade, pressão) e os sensores disponíveis para cada uma. Definição coletiva das medições que a estação fará. Croqui técnico do circuito e do invólucro de proteção.",
      prototipagem:
        "Montagem do circuito seguindo o esquema elétrico planejado. Programação do Arduino em aulas guiadas, com explicação dos comandos. Construção do invólucro com materiais reaproveitados (caixas de papelão, garrafas PET cortadas).",
      teste:
        "Coleta de dados por cinco dias consecutivos em horários fixos (manhã, tarde, noite). Comparação dos resultados com a estação meteorológica oficial mais próxima. Ajustes de calibração e análise da precisão das medições.",
      compartilhamento:
        "Instalação permanente da estação na escola, com painel de dados visível para a comunidade. Apresentação em feira de ciências com infográficos sobre o clima local. Publicação dos dados em mural digital ou rede social da escola."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 2 — Horta Hidropônica Automatizada
  // ----------------------------------------------------------
  {
    id: "lib-horta-hidroponica",
    title: "Horta Hidropônica Automatizada",
    theme: "Agricultura urbana, ciclos biogeoquímicos e automação",
    grade: "8º ano",
    duration: "8 semanas · 16 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como cultivar alimentos em espaços urbanos utilizando menos água e monitorando nutrientes de forma automatizada?",
    objectives: [
      "Compreender ciclos biogeoquímicos e nutrição vegetal",
      "Projetar sistema NFT (Nutrient Film Technique) simples",
      "Implementar sensores de pH e condutividade elétrica",
      "Calcular consumo hídrico comparado ao cultivo tradicional"
    ],
    bncc: ["EF08CI01", "EF08CI03", "EF08CI16", "EF08MA12"],
    materials: [
      "Canos PVC 75mm com furos para o cultivo",
      "Bomba submersa 12V e reservatório de água",
      "Solução nutritiva pronta (ou sais para preparo)",
      "Sensores de pH e TDS (sólidos totais dissolvidos)",
      "Sementes de alface, manjericão e rúcula",
      "Timer programável ou Arduino com módulo relé"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "FAO. Criar cidades mais verdes. Roma: Organização das Nações Unidas para a Alimentação e a Agricultura, 2012.",
      "TAIZ, Lincoln et al. Fisiologia e desenvolvimento vegetal. 6. ed. Porto Alegre: Artmed, 2017.",
      "RESH, Howard M. Hydroponic food production. 7. ed. Boca Raton: CRC Press, 2012."
    ],
    phaseDetails: {
      imersao:
        "Visita real ou virtual a uma horta urbana ou agricultura familiar. Debate sobre segurança alimentar, agrotóxicos e uso da água na produção agrícola. Análise crítica de rótulos de alimentos e da cadeia produtiva.",
      ideacao:
        "Pesquisa de técnicas hidropônicas existentes (NFT, DWC, aeroponia). Projeto do layout do sistema com escolha justificada da técnica. Elaboração de planilha de custos e estimativa de consumo de recursos.",
      prototipagem:
        "Construção da bancada de suporte. Montagem do circuito hidráulico com bomba e canos. Preparação da solução nutritiva conforme literatura técnica. Plantio das mudas nos berçários do sistema.",
      teste:
        "Monitoramento diário de pH, TDS e crescimento vegetal por quatro semanas. Registro fotográfico semanal e construção de gráficos de evolução. Ajustes na solução nutritiva conforme as leituras dos sensores.",
      compartilhamento:
        "Elaboração de livreto de receitas usando as ervas cultivadas. Oficina aberta para a comunidade escolar com demonstração do sistema. Relatório técnico final com dados comparativos de consumo de água."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 3 — Cidade Sustentável: Maquete Interativa
  // ----------------------------------------------------------
  {
    id: "lib-cidade-sustentavel",
    title: "Cidade Sustentável: Maquete Interativa",
    theme: "Urbanismo, sustentabilidade e design",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "E", "A", "M"],
    guidingQuestion:
      "Como seria uma cidade que respeita o meio ambiente e promove qualidade de vida para todos os seus habitantes?",
    objectives: [
      "Identificar problemas urbanos da comunidade local",
      "Aplicar conceitos de escala, proporção e área",
      "Integrar elementos sustentáveis ao projeto urbano",
      "Comunicar projetos de forma visual, oral e escrita"
    ],
    bncc: ["EF06CI11", "EF06GE08", "EF06MA24", "EF07AR04"],
    materials: [
      "Papelão, EVA e papel-cartão para estruturas",
      "Tinta, pincéis e materiais de colagem",
      "LEDs, pilhas e fios para iluminação",
      "Placas solares didáticas (opcional)",
      "Régua, esquadro, trena e calculadora",
      "Câmera ou celular para registro fotográfico"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "BRASIL. Estatuto da Cidade: Lei n. 10.257, de 10 de julho de 2001. Brasília, DF, 2001.",
      "GEHL, Jan. Cidades para pessoas. São Paulo: Perspectiva, 2013.",
      "LEITE, Carlos; AWAD, Juliana di Cesare Marques. Cidades sustentáveis, cidades inteligentes. Porto Alegre: Bookman, 2012."
    ],
    phaseDetails: {
      imersao:
        "Caminhada observacional pelo entorno da escola com registro fotográfico dirigido. Mapeamento coletivo dos problemas urbanos percebidos pelos estudantes. Leitura e discussão de reportagens sobre cidades sustentáveis pelo mundo.",
      ideacao:
        "Estudo de casos internacionais de urbanismo sustentável (Curitiba, Copenhague, Medellín). Esboço inicial do bairro sustentável em escala adequada. Divisão da turma em equipes responsáveis por diferentes aspectos do projeto.",
      prototipagem:
        "Construção modular da maquete em escala 1:100 ou 1:200. Inclusão de áreas verdes, ciclovias, sistema de captação de água da chuva e elementos de energia renovável. Iluminação com LEDs e pilhas.",
      teste:
        "Apresentação interna entre os grupos com sessão de feedback construtivo. Aplicação de critérios objetivos (acessibilidade, permeabilidade do solo, mobilidade urbana). Ajustes finais a partir das sugestões coletivas.",
      compartilhamento:
        "Exposição da maquete na escola com visitas guiadas pelos próprios estudantes. Produção de um manifesto em vídeo curto sobre a cidade que queremos. Convite a representantes da comunidade para visitar a exposição."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 4 — Robô Seguidor de Linha
  // ----------------------------------------------------------
  {
    id: "lib-robo-seguidor",
    title: "Robô Seguidor de Linha",
    theme: "Robótica educacional e algoritmos",
    grade: "9º ano",
    duration: "8 semanas · 16 aulas",
    steam: ["T", "E", "M"],
    guidingQuestion:
      "Como um veículo pode tomar decisões autônomas seguindo um caminho apenas com sensores de luz?",
    objectives: [
      "Compreender lógica de programação e estruturas condicionais",
      "Aplicar conceitos de eletrônica básica e ponte H",
      "Utilizar proporção, velocidade e sistemas de equações",
      "Depurar sistemas de forma iterativa e sistemática"
    ],
    bncc: ["EF09CI04", "EF09MA09", "EF09MA15"],
    materials: [
      "Chassi com 2 motores DC e rodas",
      "Arduino Uno e módulo ponte H L298N",
      "Sensores infravermelhos TCRT5000 (2 ou 3 unidades)",
      "Baterias 9V ou pack com 4 pilhas AA",
      "Fita isolante preta e papel branco para a pista",
      "Computador com Arduino IDE instalado"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "MCROBERTS, Michael. Arduino básico. São Paulo: Novatec, 2011.",
      "MONK, Simon. Programação com Arduino: começando com sketches. Porto Alegre: Bookman, 2017.",
      "MARGOLIS, Michael. Arduino cookbook. 2. ed. Sebastopol: O'Reilly Media, 2011."
    ],
    phaseDetails: {
      imersao:
        "Exibição de vídeos sobre robôs autônomos reais, do Mars Rover aos carros sem motorista. Debate sobre autonomia computacional e ética em inteligência artificial. Desafio inicial de desenhar em papel o fluxo de decisão que o robô deveria seguir.",
      ideacao:
        "Estudo do princípio físico da reflexão dos sensores infravermelhos em superfícies claras e escuras. Construção coletiva do fluxograma de decisão. Divisão das equipes em três frentes: mecânica, eletrônica e programação.",
      prototipagem:
        "Montagem mecânica do chassi com rodas e motores. Integração eletrônica do Arduino, ponte H e sensores. Programação inicial com lógica condicional simples (se sensor detecta linha, então move motor). Testes unitários de cada componente.",
      teste:
        "Competição interna em pistas de dificuldade crescente (linha reta, curvas suaves, curvas fechadas). Ajuste fino de velocidades dos motores e thresholds dos sensores. Introdução opcional de PID simplificado para grupos avançados.",
      compartilhamento:
        "Torneio aberto com convite para outras turmas competirem. Documentação técnica do projeto em formato README com fotos. Produção de vídeo tutorial publicado em canal da escola para que outros grupos possam reproduzir."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 5 — Podcast Científico Escolar
  // ----------------------------------------------------------
  {
    id: "lib-podcast-cientifico",
    title: "Podcast Científico Escolar",
    theme: "Comunicação de ciência e cultura digital",
    grade: "7º, 8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "T", "A"],
    guidingQuestion:
      "Como comunicar ciência de forma envolvente para jovens da mesma idade utilizando áudio?",
    objectives: [
      "Traduzir conteúdos científicos para linguagem acessível",
      "Dominar ferramentas básicas de gravação e edição de áudio",
      "Desenvolver roteiro, narrativa e identidade vocal própria",
      "Publicar e divulgar conteúdo em plataformas digitais"
    ],
    bncc: ["EF69LP07", "EF69LP35", "EF08CI12"],
    materials: [
      "Microfone USB simples (ou celular com bom microfone)",
      "Software gratuito de edição de áudio (Audacity)",
      "Computador ou tablet para edição",
      "Plataforma gratuita de publicação (Spotify for Podcasters)",
      "Modelo de roteiro em documento compartilhado"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "BUENO, Wilson da Costa. Comunicação científica e divulgação científica: aproximações e rupturas conceituais. Informação & Informação, Londrina, v. 15, n. esp., p. 1-12, 2010.",
      "JENKINS, Henry. Cultura da convergência. 2. ed. São Paulo: Aleph, 2009.",
      "AUDACITY TEAM. Audacity manual. Disponível em: https://manual.audacityteam.org/."
    ],
    phaseDetails: {
      imersao:
        "Audição crítica em sala de podcasts brasileiros de divulgação científica (Naruhodo, Ciência Suja, Nerdologia). Identificação dos elementos da linguagem radiofônica. Escolha coletiva e justificada do tema científico que a turma irá comunicar.",
      ideacao:
        "Pesquisa aprofundada do tema escolhido com curadoria de fontes confiáveis (artigos, livros didáticos, sites institucionais). Construção do roteiro com abertura, desenvolvimento e encerramento. Definição de vozes, papéis e cronograma de gravação.",
      prototipagem:
        "Gravação dos episódios piloto em ambiente silencioso. Edição básica no Audacity com cortes, vinhetas e trilha sonora livre de direitos autorais. Criação coletiva da capa do podcast em design colaborativo.",
      teste:
        "Audição coletiva dos episódios em sala com roda de feedback construtivo. Revisão de clareza, ritmo, qualidade da informação científica e duração. Ajustes finais de edição a partir das sugestões dos colegas.",
      compartilhamento:
        "Publicação oficial em plataforma escolhida com identidade visual. Campanha de divulgação nas redes sociais da escola. Episódio especial gravado ao vivo durante evento escolar com participação do público."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 6 — Água Potável: Sistema de Filtragem
  // ----------------------------------------------------------
  {
    id: "lib-agua-potavel",
    title: "Água Potável: Sistema de Filtragem",
    theme: "Saneamento, química e engenharia",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "E", "M"],
    guidingQuestion:
      "Como transformar água de fonte não potável em água segura para o consumo, utilizando recursos de baixo custo?",
    objectives: [
      "Compreender propriedades da água e contaminantes comuns",
      "Projetar sistema de filtragem por camadas",
      "Aplicar medições de volume, massa e vazão",
      "Avaliar qualidade da água antes e depois do tratamento"
    ],
    bncc: ["EF06CI08", "EF07CI08", "EF06MA24"],
    materials: [
      "Garrafas PET de 2 litros",
      "Areia fina, areia grossa e pedrinhas",
      "Carvão ativado",
      "Algodão, TNT ou gaze",
      "Amostras de água turva (preparadas em sala)",
      "Becker, proveta, fita de pH e papel filtro"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "BRASIL. Fundação Nacional de Saúde. Manual de saneamento. 5. ed. Brasília: Funasa, 2019.",
      "SPERLING, Marcos von. Introdução à qualidade das águas e ao tratamento de esgotos. 4. ed. Belo Horizonte: UFMG, 2014.",
      "UNICEF; WHO. Progress on household drinking water, sanitation and hygiene 2000-2022. Geneva: World Health Organization, 2023."
    ],
    phaseDetails: {
      imersao:
        "Apresentação de dados sobre acesso à água potável no Brasil e no mundo (relatórios da ONU e do Trata Brasil). Análise sensorial de diferentes amostras de água quanto a cor, cheiro e turbidez. Levantamento coletivo do ciclo urbano da água na cidade.",
      ideacao:
        "Pesquisa de métodos de filtração tradicionais e modernos (filtros de barro, estações de tratamento, zeólitas). Esboço do filtro por camadas com justificativa técnica para a escolha de cada material da estrutura.",
      prototipagem:
        "Construção do filtro em garrafa PET invertida e cortada. Montagem das camadas na ordem planejada (do mais grosso ao mais fino). Teste inicial de vazão com água limpa para validar o funcionamento.",
      teste:
        "Filtragem das amostras de água preparadas em aula. Medição comparativa de pH, turbidez e tempo de filtração antes e depois do tratamento. Comparação dos resultados entre os filtros construídos pelos diferentes grupos.",
      compartilhamento:
        "Produção de infográfico sobre acesso à água potável no Brasil. Oficina prática para turmas menores ensinando a construção do filtro. Sugestão de ações concretas que a comunidade escolar pode adotar para economizar água."
    }
  },

  // ============================================================
  // PROJETOS NOVOS — Ampliação cobrindo disciplinas do Fund. II
  // ============================================================

  // ----------------------------------------------------------
  // PROJETO 7 — Censo da Biodiversidade Local (CIÊNCIAS · BIOLOGIA)
  // ----------------------------------------------------------
  {
    id: "lib-censo-biodiversidade",
    title: "Censo da Biodiversidade Local",
    theme: "Ecologia, observação científica e cidadania ambiental",
    grade: "7º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "M"],
    guidingQuestion:
      "Quantas espécies diferentes existem no entorno da nossa escola e como podemos contribuir para sua preservação?",
    objectives: [
      "Identificar espécies vegetais e animais do entorno escolar",
      "Aplicar métodos científicos de observação e registro",
      "Utilizar aplicativos de identificação por imagem",
      "Construir um inventário digital colaborativo da biodiversidade"
    ],
    bncc: ["EF07CI07", "EF07CI08", "EF07CI10", "EF07MA37"],
    materials: [
      "Celulares com câmera (compartilhados em grupos)",
      "Aplicativo iNaturalist ou PlantNet (gratuitos)",
      "Caderno de campo para anotações",
      "Lupas simples e fita métrica",
      "Computador para organização do inventário",
      "Mapa impresso do entorno escolar"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "PRIMACK, Richard B.; RODRIGUES, Efraim. Biologia da conservação. Londrina: E. Rodrigues, 2001.",
      "ODUM, Eugene P.; BARRETT, Gary W. Fundamentos de ecologia. 5. ed. São Paulo: Cengage Learning, 2007.",
      "INATURALIST. iNaturalist teacher's guide. Disponível em: https://www.inaturalist.org/pages/teacher's+guide."
    ],
    phaseDetails: {
      imersao:
        "Discussão sobre o conceito de biodiversidade e sua importância. Análise de notícias sobre espécies em extinção no Brasil. Provocação inicial: você sabe quantas espécies vivem ao redor da sua escola? Levantamento de hipóteses iniciais.",
      ideacao:
        "Apresentação de aplicativos de ciência cidadã (iNaturalist, PlantNet). Definição dos transectos de observação no entorno escolar. Criação de protocolo de coleta de dados (foto, localização, horário, comportamento observado).",
      prototipagem:
        "Saídas de campo em grupos pelos transectos definidos. Registro fotográfico, identificação via app e anotações no caderno de campo. Construção colaborativa de planilha digital com todas as observações.",
      teste:
        "Análise quantitativa dos dados coletados (espécies por área, frequência, distribuição). Validação cruzada das identificações entre grupos. Identificação de espécies invasoras versus nativas com pesquisa complementar.",
      compartilhamento:
        "Mapa interativo da biodiversidade escolar publicado em mural digital. Apresentação dos resultados para a comunidade escolar em formato de exposição fotográfica. Proposta de ações de preservação encaminhada à direção."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 8 — Energia que Move o Mundo (CIÊNCIAS · FÍSICA)
  // ----------------------------------------------------------
  {
    id: "lib-energia-renovavel",
    title: "Energia que Move o Mundo",
    theme: "Fontes de energia renováveis e geração caseira",
    grade: "9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como podemos gerar nossa própria energia elétrica utilizando fontes renováveis com materiais acessíveis?",
    objectives: [
      "Compreender conceitos de energia, potência e eficiência",
      "Comparar diferentes fontes de geração elétrica",
      "Construir gerador eólico ou solar funcional",
      "Calcular potência gerada e eficiência do sistema"
    ],
    bncc: ["EF09CI04", "EF09CI05", "EF09CI06", "EF09MA13"],
    materials: [
      "Motores DC pequenos (12V) reaproveitados",
      "Placas solares didáticas (3W)",
      "Multímetro digital",
      "Hélices de plástico ou impressas em 3D",
      "LEDs de baixo consumo para teste de carga",
      "Fios, conectores e protoboard"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "BRASIL. Empresa de Pesquisa Energética. Balanço energético nacional. Rio de Janeiro: EPE, 2024.",
      "HEWITT, Paul G. Física conceitual. 12. ed. Porto Alegre: Bookman, 2015.",
      "VILLALVA, Marcelo Gradella. Energia solar fotovoltaica: conceitos e aplicações. 2. ed. São Paulo: Érica, 2015."
    ],
    phaseDetails: {
      imersao:
        "Análise crítica da matriz energética brasileira com dados do ONS. Visita virtual a uma usina hidrelétrica, eólica ou solar. Levantamento do consumo elétrico da própria escola (com base na conta de luz fornecida pela direção).",
      ideacao:
        "Estudo dos princípios físicos da geração elétrica (indução eletromagnética, efeito fotovoltaico). Escolha entre gerador eólico ou solar conforme disponibilidade local. Esboço técnico do sistema com cálculo de potência esperada.",
      prototipagem:
        "Montagem física do gerador escolhido. No caso eólico: hélice acoplada ao motor DC. No caso solar: circuito com placa, controlador e bateria. Integração de LED de teste como carga inicial.",
      teste:
        "Medições de tensão, corrente e potência em diferentes condições (vento, sol). Cálculo da eficiência real comparada à teórica. Análise dos fatores que influenciam o desempenho do gerador construído.",
      compartilhamento:
        "Apresentação na feira de ciências com demonstração ao vivo. Produção de cartilha com cálculos e instruções para reprodução. Proposta de implementação de painel solar didático permanente na escola."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 9 — Estatística da Nossa Escola (MATEMÁTICA)
  // ----------------------------------------------------------
  {
    id: "lib-estatistica-escolar",
    title: "Estatística da Nossa Escola",
    theme: "Pesquisa estatística aplicada à comunidade escolar",
    grade: "8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["T", "M"],
    guidingQuestion:
      "Que histórias os números podem contar sobre a nossa comunidade escolar e como apresentá-las de forma clara?",
    objectives: [
      "Planejar e aplicar pesquisa quantitativa estruturada",
      "Calcular medidas de tendência central e dispersão",
      "Construir e interpretar gráficos estatísticos diversos",
      "Comunicar conclusões com responsabilidade ética sobre dados"
    ],
    bncc: ["EF08MA23", "EF08MA24", "EF09MA20", "EF09MA21", "EF09MA22"],
    materials: [
      "Formulários impressos ou Google Forms",
      "Planilha eletrônica (Google Sheets ou Excel)",
      "Calculadora científica",
      "Computador para análise e gráficos",
      "Aplicativo de infográficos (Canva, Piktochart)"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "CRESPO, Antônio Arnot. Estatística fácil. 19. ed. São Paulo: Saraiva, 2009.",
      "BUSSAB, Wilton O.; MORETTIN, Pedro A. Estatística básica. 9. ed. São Paulo: Saraiva, 2017.",
      "IBGE. Normas de apresentação tabular. 3. ed. Rio de Janeiro: IBGE, 1993."
    ],
    phaseDetails: {
      imersao:
        "Análise crítica de gráficos de jornais e mídias com discussão sobre uso ético de estatística. Levantamento coletivo de perguntas que a turma gostaria de responder sobre a escola: tempo de deslocamento, hábitos de leitura, prática esportiva, uso de redes sociais.",
      ideacao:
        "Definição da pergunta central de pesquisa e do público-alvo (amostra). Construção colaborativa do questionário com diferentes tipos de pergunta (fechada, escalar, aberta). Estudo dos conceitos de população, amostra e viés.",
      prototipagem:
        "Aplicação da pesquisa com colegas de outras turmas (mínimo 50 respostas). Tabulação dos dados em planilha. Cálculo das medidas estatísticas (média, mediana, moda, desvio padrão).",
      teste:
        "Construção de gráficos adequados para cada tipo de variável (barras, setores, histograma, boxplot). Validação dos resultados verificando se respondem à pergunta central. Identificação de limitações da pesquisa e fontes de erro.",
      compartilhamento:
        "Produção de infográfico digital com os principais achados. Apresentação em assembleia escolar ou reunião de pais. Encaminhamento de relatório para a coordenação com sugestões baseadas nos dados levantados."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 10 — Memória Viva (HISTÓRIA)
  // ----------------------------------------------------------
  {
    id: "lib-memoria-viva",
    title: "Memória Viva: Histórias da Nossa Comunidade",
    theme: "História oral, patrimônio cultural e identidade local",
    grade: "7º e 8º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Que histórias importantes do nosso bairro estão guardadas na memória dos moradores mais antigos e como podemos preservá-las?",
    objectives: [
      "Compreender história oral como metodologia de pesquisa",
      "Conduzir entrevistas com sensibilidade e técnica",
      "Editar e produzir conteúdo audiovisual",
      "Valorizar o patrimônio imaterial e a identidade local"
    ],
    bncc: ["EF07HI16", "EF08HI21", "EF69LP38", "EF07AR07"],
    materials: [
      "Celulares ou câmeras para gravação de vídeo",
      "Microfone de lapela ou direcional (opcional)",
      "Software gratuito de edição de vídeo (CapCut, DaVinci)",
      "Termos de consentimento impressos para entrevistados",
      "Fotos antigas trazidas pelos estudantes",
      "Mapa do bairro para contextualização geográfica"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "ALBERTI, Verena. Manual de história oral. 3. ed. Rio de Janeiro: FGV, 2013.",
      "THOMPSON, Paul. A voz do passado: história oral. 3. ed. Rio de Janeiro: Paz e Terra, 2002.",
      "MUSEU DA PESSOA. Tecnologia social da memória. São Paulo: Museu da Pessoa, 2009."
    ],
    phaseDetails: {
      imersao:
        "Audição de trechos do projeto Memórias do Brasil (Museu da Pessoa). Discussão sobre o que é história oral e patrimônio imaterial. Provocação: quantas histórias importantes do nosso bairro nunca foram registradas? Levantamento de moradores antigos conhecidos pelos estudantes.",
      ideacao:
        "Estudo de técnicas de entrevista respeitosa e ética em pesquisa. Elaboração coletiva do roteiro de perguntas. Pesquisa prévia sobre o bairro em jornais antigos e arquivos online. Definição da estética do produto final.",
      prototipagem:
        "Realização das entrevistas em duplas (entrevistador e cinegrafista). Coleta de fotos antigas e materiais complementares. Transcrição parcial das falas mais marcantes para uso em legendas e narração.",
      teste:
        "Edição dos vídeos com cortes, legendas e trilha sonora autoral ou livre. Sessão de pré-estreia interna com revisão de duração, clareza e respeito aos entrevistados. Validação ética do consentimento para publicação.",
      compartilhamento:
        "Mostra de vídeos aberta à comunidade com convite especial aos entrevistados. Publicação em canal da escola no YouTube com aprovação dos participantes. Doação dos arquivos para acervo da biblioteca escolar."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 11 — Cartografia Digital do Bairro (GEOGRAFIA)
  // ----------------------------------------------------------
  {
    id: "lib-cartografia-bairro",
    title: "Cartografia Digital do Bairro",
    theme: "Geotecnologias, território e cidadania",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "M"],
    guidingQuestion:
      "Como representar digitalmente as dinâmicas e os problemas do nosso território para promover transformação social?",
    objectives: [
      "Compreender conceitos cartográficos básicos (escala, projeção)",
      "Utilizar plataformas de mapeamento colaborativo",
      "Identificar pontos críticos do território estudado",
      "Produzir mapa temático com dados próprios"
    ],
    bncc: ["EF08GE17", "EF09GE15", "EF08GE19", "EF09MA22"],
    materials: [
      "Computadores com acesso à internet",
      "Conta gratuita no Google My Maps ou OpenStreetMap",
      "Celulares com GPS para coleta de coordenadas",
      "Aplicativo de bússola e medição de distâncias",
      "Pranchetas com mapas impressos do bairro",
      "Câmera para registro fotográfico georreferenciado"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "FITZ, Paulo Roberto. Cartografia básica. São Paulo: Oficina de Textos, 2008.",
      "IBGE. Noções básicas de cartografia. Rio de Janeiro: IBGE, 1999.",
      "OPENSTREETMAP FOUNDATION. OpenStreetMap wiki: beginners' guide. Disponível em: https://wiki.openstreetmap.org/wiki/Beginners%27_guide."
    ],
    phaseDetails: {
      imersao:
        "Análise comparativa de mapas históricos e atuais do bairro. Discussão sobre o que mapas mostram e o que escondem. Definição coletiva do tema do mapeamento: acessibilidade urbana, áreas verdes, comércio local, problemas de infraestrutura ou pontos de cultura.",
      ideacao:
        "Tutorial coletivo sobre Google My Maps. Estudo de exemplos de mapas temáticos colaborativos (Wikimapia, Mapa da Bicicleta SP). Definição da legenda, dos ícones e da metodologia de coleta de pontos.",
      prototipagem:
        "Saídas de campo organizadas por setores do bairro. Coleta de coordenadas GPS, fotos e descrições padronizadas. Inserção dos pontos coletados no mapa digital colaborativo durante as aulas seguintes.",
      teste:
        "Análise quantitativa e espacial dos dados (concentração, vazios, padrões). Validação cruzada entre os grupos para evitar duplicidades. Refinamento da legenda e organização visual do mapa para garantir leitura clara.",
      compartilhamento:
        "Publicação do mapa digital com link público acessível. Apresentação em audiência pública ou reunião do conselho escolar. Encaminhamento dos resultados a órgãos públicos relevantes (subprefeitura, secretarias)."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 12 — Jornal Escolar Multimídia (LÍNGUA PORTUGUESA)
  // ----------------------------------------------------------
  {
    id: "lib-jornal-escolar",
    title: "Jornal Escolar Multimídia",
    theme: "Jornalismo, gêneros textuais e cidadania midiática",
    grade: "7º, 8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como construir um veículo de comunicação escolar que informe com qualidade e dê voz à nossa comunidade?",
    objectives: [
      "Dominar diferentes gêneros jornalísticos (notícia, reportagem, opinião)",
      "Desenvolver pensamento crítico sobre fake news e mídia",
      "Aplicar técnicas de redação, edição e diagramação",
      "Construir veículo de comunicação digital sustentável"
    ],
    bncc: ["EF69LP01", "EF69LP02", "EF69LP06", "EF69LP14", "EF89LP09"],
    materials: [
      "Computadores com editor de texto",
      "Celulares para registro fotográfico e áudio",
      "Plataforma gratuita de site (WordPress, Wix, Blogger)",
      "Software de design para diagramação (Canva)",
      "Crachás de imprensa improvisados",
      "Modelo de pauta editorial e ficha de entrevista"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "LAGE, Nilson. Estrutura da notícia. 6. ed. São Paulo: Ática, 2006.",
      "KOVACH, Bill; ROSENSTIEL, Tom. Os elementos do jornalismo. São Paulo: Geração Editorial, 2004.",
      "WARDLE, Claire; DERAKHSHAN, Hossein. Information disorder: toward an interdisciplinary framework for research and policy making. Strasbourg: Council of Europe, 2017."
    ],
    phaseDetails: {
      imersao:
        "Análise comparativa de matérias do mesmo fato em diferentes veículos brasileiros. Discussão sobre fake news, viés editorial e responsabilidade jornalística. Reflexão sobre quais histórias da escola merecem ser contadas e ainda não são.",
      ideacao:
        "Estudo dos gêneros jornalísticos (notícia, reportagem, entrevista, editorial, crítica). Definição da estrutura do jornal: editorias, periodicidade, equipe editorial. Reunião de pauta com sugestões de matérias da turma.",
      prototipagem:
        "Apuração das matérias em duplas com entrevistas e pesquisa. Redação seguindo a estrutura jornalística (lead, corpo, fechamento). Diagramação digital ou montagem do site. Revisão cruzada entre as equipes.",
      teste:
        "Conselho editorial avalia cada matéria quanto a precisão, clareza, ética e relevância. Ajustes de redação e refinamento da diagramação. Teste de leitura com público externo (família, amigos) para feedback.",
      compartilhamento:
        "Lançamento da primeira edição com evento na escola. Estabelecimento de cronograma regular de publicação. Formação de comissão permanente que continuará o jornal nos próximos meses ou anos."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 13 — Connecting Cultures (LÍNGUA INGLESA)
  // ----------------------------------------------------------
  {
    id: "lib-connecting-cultures",
    title: "Connecting Cultures: Intercâmbio Virtual",
    theme: "Comunicação intercultural em língua inglesa",
    grade: "8º e 9º ano",
    duration: "8 semanas · 16 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "How can we connect with students from other countries and share what makes our culture unique?",
    objectives: [
      "Comunicar-se em inglês em situações reais de intercâmbio",
      "Compreender e respeitar diferenças culturais",
      "Produzir conteúdo audiovisual em língua estrangeira",
      "Utilizar plataformas digitais de comunicação internacional"
    ],
    bncc: ["EF08LI01", "EF08LI13", "EF09LI03", "EF09LI16", "EF09LI18"],
    materials: [
      "Computadores com acesso à internet",
      "Plataforma ePals ou eTwinning (gratuitas)",
      "Câmera de celular para gravação de vídeos",
      "Software de edição de vídeo simples (CapCut)",
      "Tradutor offline para apoio (DeepL, Google Translate)",
      "Caderno bilíngue para vocabulário e expressões"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "BYRAM, Michael. Teaching and assessing intercultural communicative competence. Clevedon: Multilingual Matters, 1997.",
      "CRYSTAL, David. English as a global language. 2. ed. Cambridge: Cambridge University Press, 2003.",
      "COUNCIL OF EUROPE. Common European Framework of Reference for Languages: learning, teaching, assessment. Cambridge: Cambridge University Press, 2001."
    ],
    phaseDetails: {
      imersao:
        "Análise de vídeos curtos de jovens de diferentes países falando sobre seu cotidiano. Discussão sobre estereótipos culturais e a importância do contato direto com falantes. Levantamento de aspectos da cultura brasileira que os estudantes gostariam de compartilhar.",
      ideacao:
        "Cadastro coletivo em plataforma de intercâmbio escolar. Pesquisa sobre escolas parceiras potenciais e seus contextos. Elaboração coletiva de uma carta de apresentação em inglês. Estudo do vocabulário e estruturas linguísticas relevantes.",
      prototipagem:
        "Produção de vídeos curtos (1-2 min) apresentando aspectos da própria cultura: comida, festas, escola, cidade. Roteirização cuidadosa em inglês com revisão pelo professor. Gravação e edição com legendas.",
      teste:
        "Envio dos vídeos à escola parceira via plataforma. Recepção e análise dos vídeos recebidos. Sessão de comparação cultural em sala identificando semelhanças, diferenças e curiosidades. Preparação de perguntas de retorno.",
      compartilhamento:
        "Sessão ao vivo de videoconferência com a turma parceira (com mediação dos professores). Produção de relato bilíngue da experiência. Galeria de vídeos hospedada em canal escolar com legendas em ambas as línguas."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 14 — Arte Generativa (ARTE)
  // ----------------------------------------------------------
  {
    id: "lib-arte-generativa",
    title: "Arte Generativa: Código que Cria Beleza",
    theme: "Programação criativa e arte digital contemporânea",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "A", "M"],
    guidingQuestion:
      "Como combinar matemática e código para criar obras de arte que se transformam e nunca se repetem?",
    objectives: [
      "Compreender arte generativa como linguagem contemporânea",
      "Aplicar conceitos matemáticos (funções, aleatoriedade, simetria)",
      "Programar em ambiente visual de programação criativa",
      "Curar e exibir produção artística digital própria"
    ],
    bncc: ["EF89LP19", "EF09MA09", "EF08AR01", "EF08AR04", "EF09AR06"],
    materials: [
      "Computadores com navegador moderno",
      "Acesso ao p5.js Web Editor (editor.p5js.org)",
      "Tablets com canetas (opcional, para esboços)",
      "Telão ou TV grande para exposição",
      "Folhas para esboços e anotações de algoritmos"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "REAS, Casey; FRY, Ben. Processing: a programming handbook for visual designers and artists. 2. ed. Cambridge: MIT Press, 2014.",
      "SHIFFMAN, Daniel. The nature of code. New York: The Coding Train, 2012.",
      "MCCARTHY, Lauren et al. Getting started with p5.js. Sebastopol: Maker Media, 2015."
    ],
    phaseDetails: {
      imersao:
        "Apresentação de obras de artistas generativos contemporâneos (Casey Reas, Manolo Gamboa Naon, Anna Lucia). Discussão sobre o que distingue arte generativa de arte tradicional. Análise da relação entre regras matemáticas e expressão estética.",
      ideacao:
        "Tutorial inicial de p5.js com primitivas gráficas (linhas, círculos, cores). Estudo de conceitos como aleatoriedade controlada, repetição, transformação. Esboço em papel da obra que cada estudante quer criar antes de programar.",
      prototipagem:
        "Programação iterativa das obras com aulas guiadas em laboratório. Exploração de funções como random(), noise(), translate(), rotate(). Construção de variações da mesma obra alterando parâmetros para entender o efeito de cada um.",
      teste:
        "Exibição interna entre os estudantes com sessão de crítica construtiva. Refinamento estético e técnico baseado no feedback. Documentação do processo criativo em portfólio digital com explicação dos algoritmos usados.",
      compartilhamento:
        "Mostra de arte generativa com obras projetadas em telões da escola. Cada estudante apresenta brevemente sua obra e o processo. Catálogo digital online com link para versão executável de cada obra (p5.js)."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 15 — Mexa-se com Ciência (EDUCAÇÃO FÍSICA)
  // ----------------------------------------------------------
  {
    id: "lib-saude-dados",
    title: "Mexa-se com Ciência: Saúde em Dados",
    theme: "Atividade física, fisiologia e análise de dados pessoais",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "M"],
    guidingQuestion:
      "Como dados sobre nosso próprio corpo podem nos ajudar a tomar melhores decisões sobre saúde e atividade física?",
    objectives: [
      "Compreender variáveis fisiológicas básicas (frequência cardíaca, respiração)",
      "Coletar e organizar dados pessoais de atividade física",
      "Calcular e interpretar índices como IMC, FC máxima e zonas de treino",
      "Refletir criticamente sobre saúde como direito e responsabilidade"
    ],
    bncc: ["EF89EF02", "EF89EF03", "EF89EF14", "EF09CI09", "EF09MA20"],
    materials: [
      "Cronômetros (celular serve)",
      "Aplicativos gratuitos de monitoramento (Strava, Google Fit)",
      "Relógios ou aparelhos com sensor de FC (opcional)",
      "Fita métrica e balança (saúde escolar)",
      "Planilhas eletrônicas para registro",
      "Cartilha sobre privacidade de dados de saúde"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "NAHAS, Markus Vinicius. Atividade física, saúde e qualidade de vida. 7. ed. Florianópolis: Ed. do Autor, 2017.",
      "GUEDES, Dartagnan Pinto; GUEDES, Joana Elisabete Ribeiro Pinto. Manual prático para avaliação em educação física. Barueri: Manole, 2006.",
      "WORLD HEALTH ORGANIZATION. WHO guidelines on physical activity and sedentary behaviour. Geneva: WHO, 2020."
    ],
    phaseDetails: {
      imersao:
        "Discussão sobre cultura de movimento e sedentarismo na adolescência brasileira. Análise crítica de aplicativos de saúde e seus algoritmos. Reflexão sobre privacidade de dados de saúde. Estabelecimento de combinados éticos e respeitosos para o projeto.",
      ideacao:
        "Estudo das variáveis fisiológicas que podemos medir sem equipamentos caros. Definição do plano de atividade física a ser monitorado durante 4 semanas. Construção colaborativa do protocolo de coleta de dados (frequência, intensidade, sensações).",
      prototipagem:
        "Coleta diária ou semanal dos dados pelos próprios estudantes. Registro em planilha pessoal. Aulas de Educação Física com momentos dedicados à medição da FC antes, durante e após exercício. Cálculo de IMC e FC máxima.",
      teste:
        "Análise estatística dos dados pessoais (média, variação, evolução). Comparação com referências da literatura científica. Discussão crítica das limitações dos dados (não substituem avaliação médica). Reflexão individual sobre a experiência.",
      compartilhamento:
        "Roda de conversa coletiva com compartilhamento voluntário das aprendizagens. Produção de cartilha da turma sobre saúde, movimento e dados. Sessão de mexa-se aberta para a comunidade escolar com base nos achados."
    }
  },

  // ----------------------------------------------------------
  // PROJETO 16 — DIÁLOGOS DA DIVERSIDADE (INTERDISCIPLINAR · TODAS ÁREAS)
  // ----------------------------------------------------------
  {
    id: "lib-dialogos-diversidade",
    title: "Diálogos da Diversidade: Festival Cultural-Científico",
    theme: "Diversidade cultural, religiosa e científica em diálogo",
    grade: "9º ano",
    duration: "12 semanas · 24 aulas (projeto interdisciplinar do trimestre)",
    steam: ["S", "T", "E", "A", "M"],
    guidingQuestion:
      "Como diferentes culturas e tradições espirituais ao redor do mundo se relacionam com a ciência, e como podemos celebrar essas múltiplas formas de conhecer?",
    objectives: [
      "Compreender ciência e religião como formas distintas e legítimas de conhecimento",
      "Pesquisar contribuições científicas de diferentes culturas (árabe, indígena, africana, asiática)",
      "Desenvolver respeito pela diversidade religiosa e cultural",
      "Integrar conhecimentos das cinco áreas STEAM em produção complexa",
      "Organizar evento cultural-científico aberto à comunidade"
    ],
    bncc: [
      "EF09ER01",
      "EF09ER02",
      "EF09ER05",
      "EF09CI13",
      "EF09HI09",
      "EF09GE16",
      "EF89LP19",
      "EF09MA21",
      "EF09AR06"
    ],
    materials: [
      "Computadores para pesquisa e produção digital",
      "Materiais para exposição (cartolinas, telas, painéis)",
      "Equipamentos audiovisuais (projetor, caixas de som)",
      "Arduino e sensores (para módulo científico interativo)",
      "Materiais de arte diversos (tintas, tecidos, materiais de cada cultura)",
      "Espaço amplo na escola para o festival final",
      "Convites e divulgação para a comunidade externa"
    ],
    bibliography: [
      "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
      "UNESCO. Educação para a cidadania global: tópicos e objetivos de aprendizagem. Brasília: UNESCO, 2015.",
      "SANTOS, Boaventura de Sousa. Um discurso sobre as ciências. 7. ed. São Paulo: Cortez, 2010.",
      "D'AMBROSIO, Ubiratan. Etnomatemática: elo entre as tradições e a modernidade. 5. ed. Belo Horizonte: Autêntica, 2013."
    ],
    phaseDetails: {
      imersao:
        "Roda de diálogo sobre diferentes tradições culturais e religiosas presentes na turma e na comunidade. Análise de contribuições científicas que vieram de culturas além da europeia: matemática árabe (álgebra), astronomia maia, agricultura andina, medicina chinesa, astronomia islâmica. Provocação central: e se a ciência fosse apresentada celebrando todas as culturas que a construíram?",
      ideacao:
        "Divisão da turma em equipes interdisciplinares, cada uma responsável por uma cultura ou tradição. Pesquisa aprofundada articulando conhecimento científico desenvolvido pela cultura, tecnologias criadas, expressões artísticas, valores espirituais e éticos. Definição do formato de cada estação do festival (instalação interativa, performance, exposição, oficina).",
      prototipagem:
        "Produção paralela e coordenada das estações do festival: módulos interativos com Arduino (ex: estrelas maias programadas), exposições visuais (caligrafia árabe, tapeçaria andina), oficinas práticas (jogos matemáticos africanos), apresentações artísticas (música, dança). Cada equipe documenta seu processo em portfólio digital.",
      teste:
        "Ensaio geral interno com todas as estações funcionando simultaneamente. Avaliação por pares: cada equipe visita as outras dando feedback construtivo sobre clareza, respeito cultural e qualidade científica. Refinamentos finais e preparação logística do evento. Conselho de revisão final com convidados externos (família, professores de outras áreas).",
      compartilhamento:
        "Festival Cultural-Científico aberto à comunidade escolar e externa. Visitação guiada pelos próprios estudantes em todas as estações. Roda final de diálogo entre todos os participantes sobre o que aprenderam. Publicação digital permanente do projeto com fotos, vídeos e textos. Possível desdobramento como tradição anual da escola."
    }
  },

  // ============================================================
  // NOVOS PROJETOS — completar 10 projetos por tema
  // ============================================================

  {
    id: "lib-compostagem-escolar",
    title: "Compostagem Escolar Inteligente",
    theme: "Resíduos orgânicos, decomposição e monitoramento",
    grade: "6º e 7º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como transformar resíduos orgânicos da escola em adubo monitorando temperatura, umidade e tempo de decomposição?",
    objectives: [
      "Compreender decomposição e ciclagem de nutrientes",
      "Planejar uma composteira adequada ao espaço escolar",
      "Coletar dados de temperatura, umidade e volume de resíduos",
      "Comunicar práticas de redução de lixo orgânico"
    ],
    bncc: ["EF06CI11", "EF07CI08", "EF06MA24", "EF07MA35"],
    materials: [
      "Baldes ou caixas empilháveis",
      "Terra, folhas secas e resíduos orgânicos selecionados",
      "Termômetro e borrifador",
      "Balança simples",
      "Planilha para registro semanal"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_ESD,
      "BRASIL. Ministério do Meio Ambiente. Manual para implantação de compostagem e de coleta seletiva no âmbito de consórcios públicos. Brasília: MMA, 2010.",
      "EPSTEIN, Eliot. The science of composting. Boca Raton: CRC Press, 1996."
    ],
    phaseDetails: createProjectPhases("compostagem escolar e gestão de resíduos orgânicos")
  },
  {
    id: "lib-ilhas-calor-escola",
    title: "Mapa das Ilhas de Calor da Escola",
    theme: "Clima urbano, temperatura e conforto térmico",
    grade: "8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "T", "M"],
    guidingQuestion:
      "Quais lugares da escola ficam mais quentes e que intervenções podem melhorar o conforto térmico?",
    objectives: [
      "Medir temperatura em diferentes pontos da escola",
      "Representar dados térmicos em mapas simples",
      "Relacionar materiais, sombra e vegetação ao conforto térmico",
      "Propor ações de mitigação baseadas em evidências"
    ],
    bncc: ["EF07CI13", "EF08GE19", "EF08MA23", "EF09MA22"],
    materials: [
      "Termômetros digitais",
      "Mapa impresso da escola",
      "Celulares para registro fotográfico",
      "Planilha eletrônica",
      "Cartolina ou ferramenta digital de mapa"
    ],
    bibliography: [
      REF_BNCC,
      REF_NASA_CLIMATE,
      REF_UNESCO_ESD,
      "OKE, T. R. Boundary layer climates. 2. ed. London: Routledge, 1987."
    ],
    phaseDetails: createProjectPhases("ilhas de calor, sombra, vegetação e conforto térmico")
  },
  {
    id: "lib-consumo-agua-escola",
    title: "Auditoria do Consumo de Água",
    theme: "Uso racional da água e matemática aplicada",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "E", "M"],
    guidingQuestion:
      "Como medir o consumo de água da escola e propor formas concretas de reduzir desperdícios?",
    objectives: [
      "Investigar pontos de consumo e possíveis vazamentos",
      "Calcular estimativas de volume e desperdício",
      "Construir campanha de uso consciente",
      "Propor intervenções de baixo custo"
    ],
    bncc: ["EF06CI04", "EF06CI08", "EF06MA24", "EF07MA36"],
    materials: [
      "Conta de água ou dados fornecidos pela escola",
      "Recipientes graduados",
      "Cronômetro",
      "Planilhas",
      "Materiais para campanha"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_ESD,
      "BRASIL. Agência Nacional de Águas e Saneamento Básico. Conjuntura dos recursos hídricos no Brasil. Brasília: ANA, 2023.",
      "BRASIL. Fundação Nacional de Saúde. Manual de saneamento. 5. ed. Brasília: Funasa, 2019."
    ],
    phaseDetails: createProjectPhases("consumo de água, vazão, desperdício e uso racional")
  },
  {
    id: "lib-jardim-polinizadores",
    title: "Jardim de Polinizadores",
    theme: "Biodiversidade, plantas nativas e ecologia",
    grade: "6º e 7º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["S", "E", "A", "M"],
    guidingQuestion:
      "Como criar um jardim que atraia polinizadores e aumente a biodiversidade no espaço escolar?",
    objectives: [
      "Compreender relações ecológicas entre plantas e polinizadores",
      "Pesquisar espécies nativas adequadas ao contexto local",
      "Planejar canteiros considerando área, iluminação e manutenção",
      "Registrar visitas de insetos e outros animais ao jardim"
    ],
    bncc: ["EF06CI11", "EF07CI07", "EF07CI08", "EF06MA24"],
    materials: [
      "Sementes ou mudas de plantas nativas",
      "Terra e ferramentas simples de jardinagem",
      "Trena e caderno de campo",
      "Placas de identificação",
      "Celular para registro fotográfico"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_ESD,
      "IMPERATRIZ-FONSECA, Vera Lúcia; CANHOS, Dora Ann Lange; ALVES, Denise de Araujo; SARAIVA, Antonio Mauro. Polinizadores no Brasil. São Paulo: EDUSP, 2012.",
      "PRIMACK, Richard B.; RODRIGUES, Efraim. Biologia da conservação. Londrina: E. Rodrigues, 2001."
    ],
    phaseDetails: createProjectPhases("polinizadores, plantas nativas e biodiversidade escolar")
  },
  {
    id: "lib-qualidade-ar-sala",
    title: "Qualidade do Ar na Sala de Aula",
    theme: "Ar, ventilação e saúde ambiental",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como investigar a ventilação das salas e propor melhorias para a qualidade do ar?",
    objectives: [
      "Relacionar ventilação, ocupação e qualidade do ar",
      "Medir variáveis ambientais possíveis com sensores simples",
      "Analisar padrões por horário e número de pessoas",
      "Propor melhorias de ventilação e ocupação"
    ],
    bncc: ["EF08CI15", "EF09CI13", "EF08MA23", "EF09MA22"],
    materials: [
      "Sensor de CO2 didático ou medidor emprestado",
      "Termômetro e higrômetro",
      "Planilha de coleta",
      "Planta baixa da sala",
      "Cartazes para recomendações"
    ],
    bibliography: [
      REF_BNCC,
      "WORLD HEALTH ORGANIZATION. WHO global air quality guidelines. Geneva: WHO, 2021.",
      "ANVISA. Qualidade do ar interior em ambientes climatizados artificialmente de uso público e coletivo. Resolução RE n. 9, de 16 de janeiro de 2003.",
      REF_UNESCO_ESD
    ],
    phaseDetails: createProjectPhases("qualidade do ar, ventilação e saúde ambiental na escola")
  },

  {
    id: "lib-app-agenda-estudos",
    title: "App de Agenda de Estudos",
    theme: "Organização escolar, prototipagem e tecnologia",
    grade: "8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "E", "A", "M"],
    guidingQuestion:
      "Como criar um protótipo de aplicativo que ajude estudantes a organizar tarefas, provas e projetos?",
    objectives: [
      "Mapear necessidades reais dos estudantes",
      "Criar fluxos de tela e protótipos navegáveis",
      "Aplicar lógica de priorização e calendário",
      "Testar usabilidade com colegas"
    ],
    bncc: ["EF69LP07", "EF08MA23", "EF09MA22"],
    materials: [
      "Papel para wireframes",
      "Computadores ou tablets",
      "Ferramenta gratuita de prototipagem",
      "Questionários de teste",
      "Quadro Kanban"
    ],
    bibliography: [
      REF_BNCC,
      "NIELSEN, Jakob. Usability engineering. San Francisco: Morgan Kaufmann, 1993.",
      "BROWN, Tim. Design thinking: uma metodologia poderosa para decretar o fim das velhas ideias. Rio de Janeiro: Alta Books, 2020.",
      REF_UNICEF_AI
    ],
    phaseDetails: createProjectPhases("prototipagem de aplicativo e organização de estudos")
  },
  {
    id: "lib-irrigacao-automatizada",
    title: "Irrigação Automatizada de Baixo Custo",
    theme: "Automação, sensores e uso eficiente da água",
    grade: "8º e 9º ano",
    duration: "7 semanas · 14 aulas",
    steam: ["S", "T", "E", "M"],
    guidingQuestion:
      "Como automatizar a irrigação de uma planta usando sensores de umidade do solo?",
    objectives: [
      "Compreender sensores e atuadores em sistemas automatizados",
      "Montar circuito com microcontrolador e bomba ou LED indicador",
      "Testar parâmetros de umidade para acionar irrigação",
      "Avaliar economia de água e confiabilidade do sistema"
    ],
    bncc: ["EF08CI01", "EF09CI04", "EF09MA13"],
    materials: [
      "Arduino ou micro:bit",
      "Sensor de umidade do solo",
      "Módulo relé ou LED",
      "Bomba pequena opcional",
      "Vaso com planta"
    ],
    bibliography: [
      REF_BNCC,
      "MONK, Simon. Programação com Arduino: começando com sketches. Porto Alegre: Bookman, 2017.",
      "BANZI, Massimo; SHILOH, Michael. Primeiros passos com Arduino. São Paulo: Novatec, 2015.",
      REF_UNESCO_ESD
    ],
    phaseDetails: createProjectPhases("irrigação automatizada com sensor de umidade do solo")
  },
  {
    id: "lib-casa-inteligente-maquete",
    title: "Casa Inteligente em Maquete",
    theme: "Internet das coisas, energia e acessibilidade",
    grade: "8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "E", "A", "M"],
    guidingQuestion:
      "Como uma casa pode usar sensores simples para economizar energia e melhorar a acessibilidade?",
    objectives: [
      "Investigar aplicações de automação residencial",
      "Construir maquete com sensores e iluminação",
      "Relacionar automação a segurança, acessibilidade e consumo",
      "Apresentar solução com justificativa técnica"
    ],
    bncc: ["EF09CI04", "EF09MA13", "EF69LP35"],
    materials: [
      "Papelão e materiais de maquete",
      "LEDs, sensores LDR ou presença",
      "Arduino ou circuito simples",
      "Pilhas e fios",
      "Materiais de acabamento"
    ],
    bibliography: [
      REF_BNCC,
      "MCROBERTS, Michael. Arduino básico. São Paulo: Novatec, 2011.",
      REF_UNICEF_AI,
      "NORMAN, Donald A. O design do dia a dia. Rio de Janeiro: Rocco, 2006."
    ],
    phaseDetails: createProjectPhases("maquete de casa inteligente com automação e acessibilidade")
  },
  {
    id: "lib-chatbot-biblioteca",
    title: "Chatbot da Biblioteca Escolar",
    theme: "Busca de informação, linguagem e inteligência artificial",
    grade: "8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como criar um assistente conversacional simples para orientar estudantes na biblioteca escolar?",
    objectives: [
      "Mapear perguntas frequentes dos usuários da biblioteca",
      "Organizar respostas em fluxos de decisão",
      "Discutir limites e cuidados éticos em sistemas de IA",
      "Testar clareza e utilidade das respostas"
    ],
    bncc: ["EF69LP32", "EF69LP35", "EF89LP24"],
    materials: [
      "Computador com editor de texto",
      "Ferramenta gratuita de fluxograma",
      "Catálogo ou lista de livros da biblioteca",
      "Questionário de avaliação",
      "Plataforma simples de chatbot ou apresentação interativa"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNICEF_AI,
      REF_UNESCO_MIL,
      "NIELSEN, Jakob. Usability engineering. San Francisco: Morgan Kaufmann, 1993."
    ],
    phaseDetails: createProjectPhases("chatbot escolar, curadoria de informação e uso ético de IA")
  },
  {
    id: "lib-jogo-reciclagem",
    title: "Jogo Digital da Reciclagem",
    theme: "Programação, educação ambiental e game design",
    grade: "6º e 7º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "T", "A"],
    guidingQuestion:
      "Como criar um jogo simples que ensine separação correta de resíduos?",
    objectives: [
      "Pesquisar regras de coleta seletiva",
      "Planejar mecânicas de jogo e pontuação",
      "Programar interações simples em Scratch ou similar",
      "Testar o jogo com estudantes de outra turma"
    ],
    bncc: ["EF06CI11", "EF69LP07", "EF07MA05"],
    materials: [
      "Computadores com Scratch",
      "Tabela de tipos de resíduos",
      "Roteiro de jogo",
      "Imagens ou sprites autorais",
      "Ficha de feedback"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_ESD,
      "RESNICK, Mitchel. Jardim de infância para a vida toda. Porto Alegre: Penso, 2020.",
      "BRASIL. Ministério do Meio Ambiente. Coleta seletiva. Brasília: MMA."
    ],
    phaseDetails: createProjectPhases("jogo digital educativo sobre reciclagem e coleta seletiva")
  },
  {
    id: "lib-semaforo-acessivel",
    title: "Semáforo Acessível",
    theme: "Mobilidade, acessibilidade e eletrônica",
    grade: "7º e 8º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "E", "A", "M"],
    guidingQuestion:
      "Como projetar um semáforo didático que comunique sinais por luz e som?",
    objectives: [
      "Discutir acessibilidade na mobilidade urbana",
      "Construir circuito de LEDs e sinal sonoro",
      "Programar sequência temporizada",
      "Avaliar clareza dos sinais para diferentes usuários"
    ],
    bncc: ["EF07CI06", "EF07MA23", "EF69LP35"],
    materials: [
      "Arduino ou circuito com temporizador",
      "LEDs vermelho, amarelo e verde",
      "Buzzer",
      "Resistores e fios",
      "Papelão para estrutura"
    ],
    bibliography: [
      REF_BNCC,
      "BRASIL. Lei n. 13.146, de 6 de julho de 2015. Estatuto da Pessoa com Deficiência. Brasília, DF, 2015.",
      "MONK, Simon. Programação com Arduino: começando com sketches. Porto Alegre: Bookman, 2017.",
      "NORMAN, Donald A. O design do dia a dia. Rio de Janeiro: Rocco, 2006."
    ],
    phaseDetails: createProjectPhases("semáforo acessível com sinais luminosos e sonoros")
  },
  {
    id: "lib-ponte-palitos",
    title: "Ponte de Palitos: Estruturas que Suportam",
    theme: "Engenharia estrutural, forças e otimização",
    grade: "7º e 8º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "E", "M"],
    guidingQuestion:
      "Como construir uma ponte leve que suporte a maior carga possível?",
    objectives: [
      "Investigar compressão, tração e distribuição de forças",
      "Comparar treliças e formatos estruturais",
      "Calcular massa, carga suportada e eficiência",
      "Iterar protótipos a partir de testes"
    ],
    bncc: ["EF07CI01", "EF07MA32", "EF08MA13"],
    materials: [
      "Palitos de madeira",
      "Cola branca ou cola quente",
      "Pesos para teste",
      "Balança",
      "Régua e papel milimetrado"
    ],
    bibliography: [
      REF_BNCC,
      "HEWITT, Paul G. Física conceitual. 12. ed. Porto Alegre: Bookman, 2015.",
      "GERE, James M.; GOODNO, Barry J. Mecânica dos materiais. São Paulo: Cengage Learning, 2018.",
      REF_UNESCO_ESD
    ],
    phaseDetails: createProjectPhases("pontes, treliças e resistência de materiais")
  },

  {
    id: "lib-video-divulgacao-cientifica",
    title: "Vídeo Curto de Divulgação Científica",
    theme: "Ciência, roteiro e produção audiovisual",
    grade: "7º, 8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "T", "A"],
    guidingQuestion:
      "Como explicar um conceito científico em até dois minutos com rigor e linguagem acessível?",
    objectives: [
      "Selecionar fontes confiáveis",
      "Transformar conteúdo científico em roteiro curto",
      "Produzir vídeo com recursos simples",
      "Avaliar clareza, precisão e impacto comunicativo"
    ],
    bncc: ["EF69LP07", "EF69LP35", "EF08CI12"],
    materials: [
      "Celulares para gravação",
      "Editor de vídeo simples",
      "Roteiro em documento compartilhado",
      "Banco de imagens livres",
      "Rubrica de avaliação"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_MIL,
      "BUENO, Wilson da Costa. Comunicação científica e divulgação científica: aproximações e rupturas conceituais. Informação & Informação, Londrina, v. 15, n. esp., p. 1-12, 2010.",
      "WARDLE, Claire; DERAKHSHAN, Hossein. Information disorder. Strasbourg: Council of Europe, 2017."
    ],
    phaseDetails: createProjectPhases("vídeo curto de divulgação científica para jovens")
  },
  {
    id: "lib-campanha-fake-news",
    title: "Campanha contra Fake News",
    theme: "Educação midiática, checagem e cidadania digital",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como ajudar a comunidade escolar a identificar informação falsa ou manipulada?",
    objectives: [
      "Diferenciar fato, opinião, erro e desinformação",
      "Aplicar procedimentos básicos de checagem",
      "Criar peças de comunicação para a escola",
      "Avaliar impacto da campanha"
    ],
    bncc: ["EF69LP01", "EF69LP02", "EF89LP24"],
    materials: [
      "Exemplos de notícias e postagens",
      "Computadores ou celulares",
      "Ferramentas de busca reversa",
      "Canva ou editor similar",
      "Questionário pré e pós-campanha"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_MIL,
      "WARDLE, Claire; DERAKHSHAN, Hossein. Information disorder. Strasbourg: Council of Europe, 2017.",
      "UNESCO. Journalism, fake news & disinformation: handbook for journalism education and training. Paris: UNESCO, 2018."
    ],
    phaseDetails: createProjectPhases("campanha escolar de checagem de informação e combate à desinformação")
  },
  {
    id: "lib-fanzine-steam",
    title: "Fanzine STEAM",
    theme: "Leitura, autoria, artes gráficas e ciência",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "A"],
    guidingQuestion:
      "Como criar uma publicação autoral para comunicar descobertas STEAM de forma criativa?",
    objectives: [
      "Pesquisar tema científico ou tecnológico",
      "Produzir textos curtos, ilustrações e diagramas",
      "Compor páginas com leitura clara",
      "Distribuir o fanzine na comunidade escolar"
    ],
    bncc: ["EF69LP07", "EF69LP35", "EF69AR05"],
    materials: [
      "Papéis, canetas e materiais de colagem",
      "Computador ou celular para diagramação opcional",
      "Copiadora ou impressora",
      "Referências visuais",
      "Tesoura e cola"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_MIL,
      "LUPTON, Ellen. Pensar com tipos. São Paulo: Cosac Naify, 2013.",
      "MUNARI, Bruno. Das coisas nascem coisas. São Paulo: Martins Fontes, 1998."
    ],
    phaseDetails: createProjectPhases("fanzine escolar sobre descobertas STEAM")
  },
  {
    id: "lib-radio-recreio",
    title: "Rádio Recreio",
    theme: "Áudio, oralidade e comunicação escolar",
    grade: "6º, 7º e 8º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como criar boletins de áudio para informar, entreter e mobilizar a escola?",
    objectives: [
      "Planejar quadros e pautas de interesse escolar",
      "Desenvolver oralidade e roteiro radiofônico",
      "Gravar e editar áudio com qualidade básica",
      "Organizar programação responsável"
    ],
    bncc: ["EF69LP07", "EF69LP11", "EF69LP35"],
    materials: [
      "Celulares ou microfone USB",
      "Editor de áudio gratuito",
      "Roteiros impressos",
      "Caixa de som",
      "Trilhas livres de direitos"
    ],
    bibliography: [
      REF_BNCC,
      REF_UNESCO_MIL,
      "JENKINS, Henry. Cultura da convergência. 2. ed. São Paulo: Aleph, 2009.",
      "AUDACITY TEAM. Audacity manual. Disponível em: https://manual.audacityteam.org/."
    ],
    phaseDetails: createProjectPhases("rádio escolar, roteiro e edição de áudio")
  },
  {
    id: "lib-exposicao-fotografica-ciencia",
    title: "Exposição Fotográfica: Ciência no Cotidiano",
    theme: "Imagem, observação e narrativa visual",
    grade: "6º ao 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "A"],
    guidingQuestion:
      "Como fotografias podem revelar fenômenos científicos presentes no cotidiano da escola?",
    objectives: [
      "Observar fenômenos científicos no ambiente próximo",
      "Produzir fotografias com intenção investigativa",
      "Escrever legendas explicativas",
      "Organizar curadoria para exposição"
    ],
    bncc: ["EF69AR05", "EF69LP35", "EF06CI11"],
    materials: [
      "Celulares com câmera",
      "Roteiro de observação",
      "Impressão das fotos ou galeria digital",
      "Cartelas de legenda",
      "Painéis de exposição"
    ],
    bibliography: [
      REF_BNCC,
      "SONTAG, Susan. Sobre fotografia. São Paulo: Companhia das Letras, 2004.",
      "BARTHES, Roland. A câmara clara. Rio de Janeiro: Nova Fronteira, 1984.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("exposição fotográfica sobre ciência no cotidiano")
  },
  {
    id: "lib-storytelling-dados",
    title: "Histórias com Dados",
    theme: "Narrativa, gráficos e comunicação pública",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "A", "M"],
    guidingQuestion:
      "Como transformar dados da escola em uma narrativa visual clara e responsável?",
    objectives: [
      "Escolher uma pergunta investigável com dados",
      "Construir visualizações adequadas",
      "Escrever narrativa baseada em evidências",
      "Apresentar conclusões sem distorcer informações"
    ],
    bncc: ["EF08MA23", "EF09MA22", "EF69LP35"],
    materials: [
      "Planilhas",
      "Dados coletados pela turma",
      "Editor de infográficos",
      "Projetor",
      "Ficha de revisão ética"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_TABLES,
      "CAIRO, Alberto. The truthful art. Berkeley: New Riders, 2016.",
      "KNAFLIC, Cole Nussbaumer. Storytelling with data. Hoboken: Wiley, 2015."
    ],
    phaseDetails: createProjectPhases("narrativas visuais baseadas em dados escolares")
  },
  {
    id: "lib-guia-turistico-bilingue",
    title: "Guia Turístico Bilíngue do Bairro",
    theme: "Língua inglesa, cultura local e mídia digital",
    grade: "8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como apresentar pontos importantes do bairro em português e inglês para visitantes?",
    objectives: [
      "Pesquisar lugares de valor cultural no território",
      "Produzir descrições bilíngues adequadas",
      "Criar mapa ou página digital do guia",
      "Praticar comunicação intercultural"
    ],
    bncc: ["EF08LI13", "EF09LI03", "EF69LP35", "EF08GE19"],
    materials: [
      "Celulares para fotos",
      "Mapa do bairro",
      "Dicionários e tradutores como apoio",
      "Editor de página ou apresentação",
      "Roteiro de revisão linguística"
    ],
    bibliography: [
      REF_BNCC,
      "BYRAM, Michael. Teaching and assessing intercultural communicative competence. Clevedon: Multilingual Matters, 1997.",
      "CRYSTAL, David. English as a global language. 2. ed. Cambridge: Cambridge University Press, 2003.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("guia turístico bilíngue do bairro e comunicação intercultural")
  },

  {
    id: "lib-linha-tempo-bairro",
    title: "Linha do Tempo do Bairro",
    theme: "Memória local, história e visualização temporal",
    grade: "7º e 8º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "A", "M"],
    guidingQuestion:
      "Como organizar acontecimentos do bairro em uma linha do tempo visual e confiável?",
    objectives: [
      "Pesquisar eventos significativos da comunidade",
      "Trabalhar noções de temporalidade e fonte histórica",
      "Construir linha do tempo física ou digital",
      "Apresentar relações entre memória e identidade"
    ],
    bncc: ["EF07HI16", "EF08HI21", "EF69LP35"],
    materials: [
      "Entrevistas e fotos antigas",
      "Cartolinas ou ferramenta digital",
      "Scanner ou celular",
      "Fichas de fonte histórica",
      "Mapa do bairro"
    ],
    bibliography: [
      REF_BNCC,
      "ALBERTI, Verena. Manual de história oral. 3. ed. Rio de Janeiro: FGV, 2013.",
      "THOMPSON, Paul. A voz do passado: história oral. 3. ed. Rio de Janeiro: Paz e Terra, 2002.",
      "MUSEU DA PESSOA. Tecnologia social da memória. São Paulo: Museu da Pessoa, 2009."
    ],
    phaseDetails: createProjectPhases("linha do tempo histórica do bairro")
  },
  {
    id: "lib-mapa-afetivo-escola",
    title: "Mapa Afetivo da Escola",
    theme: "Território, pertencimento e cartografia social",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["A", "M"],
    guidingQuestion:
      "Quais lugares da escola têm significado para os estudantes e como representá-los em um mapa afetivo?",
    objectives: [
      "Compreender mapas como representações sociais",
      "Coletar percepções sobre espaços escolares",
      "Criar símbolos e legendas autorais",
      "Dialogar sobre convivência e pertencimento"
    ],
    bncc: ["EF06GE08", "EF06MA24", "EF69AR05"],
    materials: [
      "Planta baixa ou croqui da escola",
      "Post-its e adesivos coloridos",
      "Canetas e cartolinas",
      "Questionário breve",
      "Painel para exposição"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_CARTOGRAPHY,
      "ACSELRAD, Henri. Cartografias sociais e território. Rio de Janeiro: IPPUR/UFRJ, 2008.",
      "TUAN, Yi-Fu. Espaço e lugar: a perspectiva da experiência. Londrina: Eduel, 2013."
    ],
    phaseDetails: createProjectPhases("mapa afetivo, pertencimento e cartografia social")
  },
  {
    id: "lib-patrimonio-imaterial",
    title: "Patrimônio Imaterial da Comunidade",
    theme: "Cultura, memória e registro audiovisual",
    grade: "7º, 8º e 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Quais práticas culturais da comunidade merecem ser registradas e valorizadas pela escola?",
    objectives: [
      "Identificar manifestações culturais locais",
      "Registrar relatos, imagens e sons com consentimento",
      "Compreender patrimônio material e imaterial",
      "Criar acervo digital escolar"
    ],
    bncc: ["EF07HI16", "EF08HI21", "EF69AR34", "EF69LP35"],
    materials: [
      "Celulares para áudio e vídeo",
      "Termo de autorização",
      "Roteiro de entrevista",
      "Pasta digital organizada",
      "Painel ou site simples"
    ],
    bibliography: [
      REF_BNCC,
      "IPHAN. Educação patrimonial: histórico, conceitos e processos. Brasília: IPHAN, 2014.",
      "UNESCO. Convention for the safeguarding of the intangible cultural heritage. Paris: UNESCO, 2003.",
      "ALBERTI, Verena. Manual de história oral. 3. ed. Rio de Janeiro: FGV, 2013."
    ],
    phaseDetails: createProjectPhases("patrimônio imaterial e acervo cultural comunitário")
  },
  {
    id: "lib-rotas-seguras",
    title: "Rotas Seguras até a Escola",
    theme: "Mobilidade, território e segurança viária",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "E", "M"],
    guidingQuestion:
      "Como mapear rotas de deslocamento e propor caminhos mais seguros até a escola?",
    objectives: [
      "Coletar dados sobre deslocamento dos estudantes",
      "Mapear pontos de risco no entorno",
      "Analisar padrões de mobilidade",
      "Propor intervenções e recomendações"
    ],
    bncc: ["EF08GE17", "EF08GE19", "EF09MA22"],
    materials: [
      "Mapas impressos ou digitais",
      "Celulares com GPS",
      "Formulário de pesquisa",
      "Planilha",
      "Materiais para relatório"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_CARTOGRAPHY,
      "BRASIL. Código de Trânsito Brasileiro: Lei n. 9.503, de 23 de setembro de 1997. Brasília, DF, 1997.",
      "WORLD HEALTH ORGANIZATION. Global plan for the decade of action for road safety 2021-2030. Geneva: WHO, 2021."
    ],
    phaseDetails: createProjectPhases("rotas seguras, mobilidade escolar e mapeamento territorial")
  },
  {
    id: "lib-atlas-cultural-digital",
    title: "Atlas Cultural Digital",
    theme: "Geografia cultural, memória e mídias digitais",
    grade: "8º e 9º ano",
    duration: "7 semanas · 14 aulas",
    steam: ["T", "A", "M"],
    guidingQuestion:
      "Como criar um atlas digital que represente lugares, histórias e práticas culturais do território?",
    objectives: [
      "Selecionar categorias culturais para mapeamento",
      "Registrar dados com localização e descrição",
      "Organizar mapa digital com legenda clara",
      "Discutir representação e responsabilidade cultural"
    ],
    bncc: ["EF08GE19", "EF09GE15", "EF69LP35"],
    materials: [
      "Google My Maps ou OpenStreetMap",
      "Celulares com câmera",
      "Fichas de campo",
      "Termos de autorização",
      "Computadores"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_CARTOGRAPHY,
      "IPHAN. Educação patrimonial: histórico, conceitos e processos. Brasília: IPHAN, 2014.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("atlas cultural digital do território")
  },
  {
    id: "lib-museu-virtual-escola",
    title: "Museu Virtual da Escola",
    theme: "Memória institucional, curadoria e tecnologia",
    grade: "7º ao 9º ano",
    duration: "6 semanas · 12 aulas",
    steam: ["T", "A"],
    guidingQuestion:
      "Como transformar objetos, fotos e relatos da escola em uma exposição virtual?",
    objectives: [
      "Selecionar itens significativos da história escolar",
      "Escrever textos curatoriais curtos",
      "Digitalizar imagens e organizar arquivos",
      "Montar exposição virtual acessível"
    ],
    bncc: ["EF07HI16", "EF69LP35", "EF69AR34"],
    materials: [
      "Fotos e documentos autorizados",
      "Scanner ou celular",
      "Editor de apresentação ou site",
      "Roteiro curatorial",
      "Computadores"
    ],
    bibliography: [
      REF_BNCC,
      "MUSEU DA PESSOA. Tecnologia social da memória. São Paulo: Museu da Pessoa, 2009.",
      "IPHAN. Educação patrimonial: histórico, conceitos e processos. Brasília: IPHAN, 2014.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("museu virtual da escola e curadoria de memória")
  },
  {
    id: "lib-demografia-bairro",
    title: "Retrato Demográfico do Bairro",
    theme: "População, território e leitura de dados públicos",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "M"],
    guidingQuestion:
      "O que os dados públicos revelam sobre a população e as transformações do nosso bairro?",
    objectives: [
      "Ler tabelas e mapas demográficos",
      "Comparar indicadores de diferentes recortes territoriais",
      "Produzir síntese visual dos achados",
      "Discutir limites e cuidados na interpretação de dados públicos"
    ],
    bncc: ["EF08GE17", "EF09GE14", "EF09MA22"],
    materials: [
      "Computadores com internet",
      "Dados do IBGE",
      "Planilhas",
      "Mapas do município",
      "Editor de infográfico"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_TABLES,
      "IBGE. Censo demográfico 2022: características da população e dos domicílios. Rio de Janeiro: IBGE, 2023.",
      REF_IBGE_CARTOGRAPHY
    ],
    phaseDetails: createProjectPhases("retrato demográfico do bairro com dados públicos")
  },

  {
    id: "lib-orcamento-feira",
    title: "Orçamento de uma Feira Escolar",
    theme: "Educação financeira, porcentagem e planejamento",
    grade: "7º e 8º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["M", "T"],
    guidingQuestion:
      "Como planejar o orçamento de uma feira escolar equilibrando custos, preços e metas?",
    objectives: [
      "Levantar custos fixos e variáveis",
      "Calcular porcentagens, margem e ponto de equilíbrio",
      "Construir planilhas de orçamento",
      "Tomar decisões financeiras responsáveis"
    ],
    bncc: ["EF07MA02", "EF07MA05", "EF08MA04", "EF08MA23"],
    materials: [
      "Planilha eletrônica",
      "Lista de insumos",
      "Calculadora",
      "Tabela de preços pesquisados",
      "Modelo de orçamento"
    ],
    bibliography: [
      REF_BNCC,
      "BANCO CENTRAL DO BRASIL. Caderno de educação financeira: gestão de finanças pessoais. Brasília: BCB, 2013.",
      "OECD. PISA 2018 financial literacy framework. Paris: OECD Publishing, 2019.",
      REF_IBGE_TABLES
    ],
    phaseDetails: createProjectPhases("orçamento de feira escolar e educação financeira")
  },
  {
    id: "lib-pesquisa-alimentacao",
    title: "Pesquisa sobre Alimentação na Escola",
    theme: "Estatística, hábitos alimentares e saúde",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "M"],
    guidingQuestion:
      "Quais são os hábitos alimentares dos estudantes e como representá-los com responsabilidade?",
    objectives: [
      "Planejar questionário ético e anônimo",
      "Tabular respostas e calcular frequências",
      "Produzir gráficos adequados",
      "Debater alimentação saudável sem exposição individual"
    ],
    bncc: ["EF08MA23", "EF09MA22", "EF09CI09"],
    materials: [
      "Google Forms ou formulários impressos",
      "Planilhas",
      "Guia alimentar",
      "Editor de gráficos",
      "Termos de privacidade"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_TABLES,
      "BRASIL. Ministério da Saúde. Guia alimentar para a população brasileira. 2. ed. Brasília: Ministério da Saúde, 2014.",
      REF_WHO_ACTIVITY
    ],
    phaseDetails: createProjectPhases("pesquisa estatística sobre hábitos alimentares")
  },
  {
    id: "lib-geometria-quadra",
    title: "Geometria da Quadra Escolar",
    theme: "Medidas, escala e desenho geométrico",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["E", "M"],
    guidingQuestion:
      "Como representar a quadra da escola em escala e propor melhorias no espaço?",
    objectives: [
      "Medir dimensões reais do espaço",
      "Calcular perímetro, área e escala",
      "Criar planta baixa simplificada",
      "Propor reorganização do espaço com justificativa matemática"
    ],
    bncc: ["EF06MA24", "EF06MA28", "EF07MA32"],
    materials: [
      "Trena",
      "Papel quadriculado",
      "Régua e esquadro",
      "Calculadora",
      "Software de desenho opcional"
    ],
    bibliography: [
      REF_BNCC,
      "DOLCE, Osvaldo; POMPEO, José Nicolau. Fundamentos de matemática elementar: geometria plana. São Paulo: Atual, 2013.",
      REF_IBGE_CARTOGRAPHY,
      "BRASIL. Ministério da Educação. Parâmetros básicos de infraestrutura para instituições de educação infantil. Brasília: MEC, 2006."
    ],
    phaseDetails: createProjectPhases("geometria, escala e reorganização da quadra escolar")
  },
  {
    id: "lib-probabilidade-jogos",
    title: "Probabilidade em Jogos de Tabuleiro",
    theme: "Jogos, chance e tomada de decisão",
    grade: "7º e 8º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["A", "M"],
    guidingQuestion:
      "Como a probabilidade influencia estratégias e equilíbrio em jogos de tabuleiro?",
    objectives: [
      "Simular eventos aleatórios com dados e cartas",
      "Calcular frequências e probabilidades simples",
      "Modificar regras para equilibrar um jogo",
      "Explicar decisões com base em dados"
    ],
    bncc: ["EF07MA34", "EF08MA22", "EF08MA23"],
    materials: [
      "Dados, cartas e fichas",
      "Planilhas de registro",
      "Protótipos de tabuleiro",
      "Calculadora",
      "Materiais de arte"
    ],
    bibliography: [
      REF_BNCC,
      "MORGADO, Augusto César et al. Análise combinatória e probabilidade. Rio de Janeiro: SBM, 1991.",
      "GRANDO, Regina Célia. O jogo e a matemática no contexto da sala de aula. São Paulo: Paulus, 2004.",
      REF_IBGE_TABLES
    ],
    phaseDetails: createProjectPhases("probabilidade e equilíbrio em jogos de tabuleiro")
  },
  {
    id: "lib-indice-leitura",
    title: "Índice de Leitura da Turma",
    theme: "Dados, leitura e visualização",
    grade: "6º ao 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["T", "M"],
    guidingQuestion:
      "Como medir e visualizar hábitos de leitura da turma sem expor dados pessoais?",
    objectives: [
      "Coletar dados anônimos sobre leitura",
      "Criar indicadores simples",
      "Construir gráficos e painéis",
      "Planejar ações de incentivo à leitura"
    ],
    bncc: ["EF69LP49", "EF08MA23", "EF09MA22"],
    materials: [
      "Formulário anônimo",
      "Planilha",
      "Acervo da biblioteca",
      "Editor de gráficos",
      "Painel de metas coletivas"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_TABLES,
      "FAILLA, Zoara (org.). Retratos da leitura no Brasil. 5. ed. Rio de Janeiro: Sextante, 2021.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("indicadores de leitura e visualização de hábitos da turma")
  },
  {
    id: "lib-matematica-transporte",
    title: "Matemática do Transporte Escolar",
    theme: "Tempo, distância, custo e otimização",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "E", "M"],
    guidingQuestion:
      "Como analisar rotas, tempos e custos de deslocamento para chegar à escola?",
    objectives: [
      "Coletar tempos e distâncias de deslocamento",
      "Calcular médias, variações e custos aproximados",
      "Representar rotas em mapa",
      "Discutir alternativas sustentáveis e seguras"
    ],
    bncc: ["EF08MA23", "EF09MA13", "EF09MA22"],
    materials: [
      "Formulário anônimo",
      "Mapas digitais",
      "Planilha",
      "Calculadora",
      "Infográfico"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_CARTOGRAPHY,
      REF_IBGE_TABLES,
      "BRASIL. Código de Trânsito Brasileiro: Lei n. 9.503, de 23 de setembro de 1997. Brasília, DF, 1997."
    ],
    phaseDetails: createProjectPhases("tempos, distâncias e custos do transporte escolar")
  },
  {
    id: "lib-simulador-juros",
    title: "Simulador de Juros no Cotidiano",
    theme: "Educação financeira e funções",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "M"],
    guidingQuestion:
      "Como juros simples e compostos afetam compras parceladas e metas de economia?",
    objectives: [
      "Comparar juros simples e compostos",
      "Criar simulador em planilha",
      "Analisar compras parceladas com senso crítico",
      "Comunicar decisões financeiras fundamentadas"
    ],
    bncc: ["EF08MA04", "EF09MA05", "EF09MA06"],
    materials: [
      "Planilha eletrônica",
      "Exemplos de anúncios",
      "Calculadora",
      "Roteiro de análise",
      "Projetor"
    ],
    bibliography: [
      REF_BNCC,
      "BANCO CENTRAL DO BRASIL. Caderno de educação financeira: gestão de finanças pessoais. Brasília: BCB, 2013.",
      "OECD. PISA 2018 financial literacy framework. Paris: OECD Publishing, 2019.",
      "IEZZI, Gelson; MURAKAMI, Carlos. Fundamentos de matemática elementar: conjuntos e funções. São Paulo: Atual, 2013."
    ],
    phaseDetails: createProjectPhases("simulador de juros simples e compostos em planilha")
  },
  {
    id: "lib-censo-esportivo",
    title: "Censo Esportivo da Escola",
    theme: "Estatística, esporte e participação",
    grade: "7º ao 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["M", "S"],
    guidingQuestion:
      "Quais práticas corporais os estudantes conhecem, praticam ou gostariam de experimentar?",
    objectives: [
      "Planejar pesquisa estatística sobre práticas corporais",
      "Tabular dados por turma e faixa etária",
      "Construir gráficos comparativos",
      "Sugerir ações para ampliar participação"
    ],
    bncc: ["EF89EF02", "EF08MA23", "EF09MA22"],
    materials: [
      "Questionário anônimo",
      "Planilha",
      "Gráficos impressos",
      "Quadro de propostas",
      "Rubrica de apresentação"
    ],
    bibliography: [
      REF_BNCC,
      REF_WHO_ACTIVITY,
      REF_IBGE_TABLES,
      "NAHAS, Markus Vinicius. Atividade física, saúde e qualidade de vida. 7. ed. Florianópolis: Ed. do Autor, 2017."
    ],
    phaseDetails: createProjectPhases("censo esportivo escolar e análise estatística")
  },
  {
    id: "lib-dashboard-biblioteca",
    title: "Dashboard da Biblioteca Escolar",
    theme: "Dados, acervo e tomada de decisão",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["T", "M"],
    guidingQuestion:
      "Como os dados de empréstimos e acervo podem apoiar decisões da biblioteca escolar?",
    objectives: [
      "Organizar dados de acervo e circulação",
      "Criar indicadores e gráficos",
      "Identificar padrões de uso da biblioteca",
      "Propor ações de incentivo à leitura"
    ],
    bncc: ["EF08MA23", "EF09MA22", "EF69LP49"],
    materials: [
      "Dados autorizados da biblioteca",
      "Planilha eletrônica",
      "Editor de dashboard",
      "Computador",
      "Roteiro de privacidade"
    ],
    bibliography: [
      REF_BNCC,
      REF_IBGE_TABLES,
      "KNAFLIC, Cole Nussbaumer. Storytelling with data. Hoboken: Wiley, 2015.",
      REF_UNESCO_MIL
    ],
    phaseDetails: createProjectPhases("dashboard de acervo e empréstimos da biblioteca escolar")
  },

  {
    id: "lib-sono-aprendizagem",
    title: "Sono e Aprendizagem",
    theme: "Hábitos de sono, saúde e análise de dados",
    grade: "8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "M"],
    guidingQuestion:
      "Como hábitos de sono se relacionam com disposição, concentração e rotina escolar?",
    objectives: [
      "Pesquisar recomendações de sono para adolescentes",
      "Coletar dados anônimos sobre rotina de sono",
      "Analisar padrões sem expor indivíduos",
      "Criar campanha de cuidado com o sono"
    ],
    bncc: ["EF09CI09", "EF08MA23", "EF89EF14"],
    materials: [
      "Formulário anônimo",
      "Planilhas",
      "Materiais de campanha",
      "Diário voluntário de sono",
      "Cartazes"
    ],
    bibliography: [
      REF_BNCC,
      "WORLD HEALTH ORGANIZATION. Adolescent health. Geneva: WHO. Disponível em: https://www.who.int/health-topics/adolescent-health.",
      REF_WHO_ACTIVITY,
      "LOUZADA, Fernando; MENNA-BARRETO, Luiz. O sono na sala de aula: tempo escolar e tempo biológico. Rio de Janeiro: Vieira & Lent, 2007."
    ],
    phaseDetails: createProjectPhases("sono, rotina escolar e aprendizagem")
  },
  {
    id: "lib-ergonomia-mochila",
    title: "Mochila, Postura e Ergonomia",
    theme: "Corpo, medidas e prevenção",
    grade: "6º e 7º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "M"],
    guidingQuestion:
      "Como avaliar o peso das mochilas e propor cuidados ergonômicos para estudantes?",
    objectives: [
      "Medir massas de mochilas de forma ética",
      "Calcular proporções e médias",
      "Pesquisar recomendações de ergonomia",
      "Criar orientações para a comunidade escolar"
    ],
    bncc: ["EF06MA24", "EF07MA36", "EF89EF14"],
    materials: [
      "Balança",
      "Formulário anônimo",
      "Planilha",
      "Cartazes",
      "Fita métrica"
    ],
    bibliography: [
      REF_BNCC,
      REF_WHO_ACTIVITY,
      "IIDA, Itiro; BUARQUE, Lia. Ergonomia: projeto e produção. 3. ed. São Paulo: Blucher, 2016.",
      REF_IBGE_TABLES
    ],
    phaseDetails: createProjectPhases("ergonomia, peso da mochila e prevenção de desconfortos")
  },
  {
    id: "lib-hidratacao-esporte",
    title: "Hidratação e Esporte",
    theme: "Atividade física, água e autorregulação",
    grade: "7º ao 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "M"],
    guidingQuestion:
      "Como planejar hidratação segura antes, durante e depois de atividades físicas escolares?",
    objectives: [
      "Compreender a importância da hidratação",
      "Medir intensidade percebida e tempo de atividade",
      "Criar protocolo de hidratação para aulas práticas",
      "Comunicar cuidados sem substituir orientação médica"
    ],
    bncc: ["EF89EF02", "EF89EF14", "EF09CI09"],
    materials: [
      "Garrafas identificadas",
      "Cronômetros",
      "Escala de percepção de esforço",
      "Cartazes",
      "Planilha de observação"
    ],
    bibliography: [
      REF_BNCC,
      REF_WHO_ACTIVITY,
      "BRASIL. Ministério da Saúde. Guia alimentar para a população brasileira. 2. ed. Brasília: Ministério da Saúde, 2014.",
      "NAHAS, Markus Vinicius. Atividade física, saúde e qualidade de vida. 7. ed. Florianópolis: Ed. do Autor, 2017."
    ],
    phaseDetails: createProjectPhases("hidratação, atividade física e cuidado corporal")
  },
  {
    id: "lib-pausa-ativa",
    title: "Pausas Ativas na Rotina Escolar",
    theme: "Movimento, bem-estar e aprendizagem",
    grade: "6º ao 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "A", "M"],
    guidingQuestion:
      "Como pequenas pausas de movimento podem impactar bem-estar e atenção durante a rotina escolar?",
    objectives: [
      "Pesquisar benefícios de atividade física regular",
      "Planejar pausas ativas curtas e inclusivas",
      "Coletar percepções antes e depois das práticas",
      "Criar repertório de atividades para professores"
    ],
    bncc: ["EF89EF02", "EF89EF14", "EF08MA23"],
    materials: [
      "Cronômetro",
      "Música opcional",
      "Questionários rápidos",
      "Planilha",
      "Cartões de atividade"
    ],
    bibliography: [
      REF_BNCC,
      REF_WHO_ACTIVITY,
      "NAHAS, Markus Vinicius. Atividade física, saúde e qualidade de vida. 7. ed. Florianópolis: Ed. do Autor, 2017.",
      REF_IBGE_TABLES
    ],
    phaseDetails: createProjectPhases("pausas ativas, bem-estar e atenção na rotina escolar")
  },
  {
    id: "lib-alimentacao-cores",
    title: "Prato Colorido: Alimentação e Nutrientes",
    theme: "Alimentação saudável, cores e composição nutricional",
    grade: "6º e 7º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["S", "A", "M"],
    guidingQuestion:
      "Como as cores dos alimentos podem ajudar a conversar sobre variedade alimentar?",
    objectives: [
      "Investigar grupos alimentares e diversidade no prato",
      "Criar representações visuais de refeições equilibradas",
      "Analisar hábitos coletivos com cuidado ético",
      "Produzir campanha educativa"
    ],
    bncc: ["EF05CI08", "EF06CI04", "EF06MA24"],
    materials: [
      "Guia alimentar",
      "Cartolinas e materiais de arte",
      "Imagens de alimentos",
      "Planilha simples",
      "Questionário anônimo"
    ],
    bibliography: [
      REF_BNCC,
      "BRASIL. Ministério da Saúde. Guia alimentar para a população brasileira. 2. ed. Brasília: Ministério da Saúde, 2014.",
      REF_WHO_ACTIVITY,
      REF_UNESCO_ESD
    ],
    phaseDetails: createProjectPhases("alimentação saudável, variedade alimentar e comunicação visual")
  },
  {
    id: "lib-frequencia-cardiaca",
    title: "Frequência Cardíaca em Movimento",
    theme: "Fisiologia, exercício e gráficos",
    grade: "8º e 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "M"],
    guidingQuestion:
      "Como a frequência cardíaca muda em diferentes intensidades de movimento?",
    objectives: [
      "Medir frequência cardíaca com segurança",
      "Comparar repouso, atividade leve e atividade intensa",
      "Construir gráficos de variação",
      "Discutir limites dos dados coletados"
    ],
    bncc: ["EF09CI09", "EF89EF02", "EF08MA23"],
    materials: [
      "Cronômetros",
      "Planilhas",
      "Espaço para atividade física",
      "Ficha de consentimento conforme orientação escolar",
      "Cartões de intensidade"
    ],
    bibliography: [
      REF_BNCC,
      REF_WHO_ACTIVITY,
      "GUEDES, Dartagnan Pinto; GUEDES, Joana Elisabete Ribeiro Pinto. Manual prático para avaliação em educação física. Barueri: Manole, 2006.",
      "NAHAS, Markus Vinicius. Atividade física, saúde e qualidade de vida. 7. ed. Florianópolis: Ed. do Autor, 2017."
    ],
    phaseDetails: createProjectPhases("frequência cardíaca, intensidade de exercício e gráficos")
  },
  {
    id: "lib-saude-mental-campanha",
    title: "Campanha de Bem-Estar Emocional",
    theme: "Saúde mental, convivência e comunicação responsável",
    grade: "8º e 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["A", "T"],
    guidingQuestion:
      "Como comunicar cuidados de bem-estar emocional de forma acolhedora e responsável na escola?",
    objectives: [
      "Pesquisar fontes institucionais sobre saúde mental",
      "Mapear situações de estresse na rotina escolar sem expor pessoas",
      "Criar peças de comunicação cuidadosas",
      "Indicar canais de apoio disponíveis na escola"
    ],
    bncc: ["EF89EF14", "EF69LP35", "EF69AR05"],
    materials: [
      "Fontes institucionais",
      "Editor de cartazes",
      "Roteiro de linguagem responsável",
      "Painel de divulgação",
      "Apoio da coordenação/orientação"
    ],
    bibliography: [
      REF_BNCC,
      "WORLD HEALTH ORGANIZATION. Mental health of adolescents. Geneva: WHO. Disponível em: https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health.",
      REF_UNESCO_MIL,
      "BRASIL. Ministério da Saúde. Saúde mental. Brasília: Ministério da Saúde."
    ],
    phaseDetails: createProjectPhases("campanha escolar de bem-estar emocional e convivência")
  },
  {
    id: "lib-acessibilidade-esporte",
    title: "Esporte para Todos",
    theme: "Inclusão, adaptação de regras e acessibilidade",
    grade: "6º ao 9º ano",
    duration: "5 semanas · 10 aulas",
    steam: ["E", "A", "M"],
    guidingQuestion:
      "Como adaptar jogos e esportes para ampliar a participação de todos os estudantes?",
    objectives: [
      "Analisar barreiras de participação em práticas corporais",
      "Adaptar regras, espaços e materiais",
      "Testar versões inclusivas de jogos",
      "Registrar feedback e refinar propostas"
    ],
    bncc: ["EF89EF01", "EF89EF02", "EF89EF14"],
    materials: [
      "Bolas variadas",
      "Cones e fitas",
      "Vendas ou sinalizadores",
      "Ficha de observação",
      "Materiais reaproveitados"
    ],
    bibliography: [
      REF_BNCC,
      "BRASIL. Lei n. 13.146, de 6 de julho de 2015. Estatuto da Pessoa com Deficiência. Brasília, DF, 2015.",
      REF_WHO_ACTIVITY,
      "FREIRE, João Batista. Educação de corpo inteiro. São Paulo: Scipione, 1997."
    ],
    phaseDetails: createProjectPhases("adaptação inclusiva de jogos e esportes escolares")
  },
  {
    id: "lib-mapa-ruido-escola",
    title: "Mapa do Ruído Escolar",
    theme: "Audição, ambiente e saúde coletiva",
    grade: "7º ao 9º ano",
    duration: "4 semanas · 8 aulas",
    steam: ["S", "T", "M"],
    guidingQuestion:
      "Quais espaços da escola têm maior nível de ruído e como reduzir incômodos?",
    objectives: [
      "Medir níveis de ruído com aplicativo ou decibelímetro",
      "Mapear horários e locais críticos",
      "Analisar efeitos do ruído no bem-estar",
      "Propor combinados e intervenções"
    ],
    bncc: ["EF08CI15", "EF08MA23", "EF89EF14"],
    materials: [
      "Aplicativo medidor de decibéis ou decibelímetro",
      "Mapa da escola",
      "Planilha",
      "Cartazes",
      "Relógio"
    ],
    bibliography: [
      REF_BNCC,
      "WORLD HEALTH ORGANIZATION. Environmental noise guidelines for the European Region. Copenhagen: WHO Regional Office for Europe, 2018.",
      REF_WHO_ACTIVITY,
      REF_IBGE_CARTOGRAPHY
    ],
    phaseDetails: createProjectPhases("mapa de ruído escolar e saúde ambiental")
  }
];

// ------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ------------------------------------------------------------

// Busca um projeto da biblioteca pelo seu identificador.
export function getLibraryProjectById(id) {
  return LIBRARY.find((project) => project.id === id);
}

// Filtra projetos da biblioteca por ano escolar.
export function getLibraryProjectsByGrade(grade) {
  return LIBRARY.filter((project) => project.grade.includes(grade));
}

// Filtra projetos que contemplam uma área STEAM específica.
export function getLibraryProjectsByArea(areaLetter) {
  return LIBRARY.filter((project) => project.steam.includes(areaLetter));
}
