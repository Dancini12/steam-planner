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
