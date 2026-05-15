import Modal from "../ui/Modal.jsx";

const STEAM_AREAS = [
  { letter: "S", name: "Ciência", color: "#10B981", desc: "Investigação, experimentos, método científico e observação do mundo natural." },
  { letter: "T", name: "Tecnologia", color: "#3B82F6", desc: "Criação e uso de ferramentas digitais, programação e automação de processos." },
  { letter: "E", name: "Engenharia", color: "#F59E0B", desc: "Design de soluções, construção de protótipos e ciclos de teste e melhoria." },
  { letter: "A", name: "Artes", color: "#EC4899", desc: "Expressão criativa, design visual, comunicação e pensamento estético." },
  { letter: "M", name: "Matemática", color: "#8B5CF6", desc: "Lógica, cálculo, modelagem de problemas e identificação de padrões." },
];

const MAKER_ELEMENTS = [
  { icon: "🔨", label: "Construir", desc: "Os alunos criam com as próprias mãos, tornando o aprendizado concreto e memorável." },
  { icon: "🔄", label: "Testar", desc: "Testar revela o que funciona — e o que não funciona ensina ainda mais." },
  { icon: "✏️", label: "Melhorar", desc: "Iterar é a essência do Maker: cada versão é melhor que a anterior." },
  { icon: "👥", label: "Colaborar", desc: "Trabalho em equipe desenvolve comunicação, escuta ativa e resolução de conflitos." },
  { icon: "📢", label: "Apresentar", desc: "Compartilhar o resultado consolida o aprendizado e desenvolve confiança." },
];

const TIP_TYPES = [
  { icon: "⚡", title: "Dica STEAM", color: "#4F46E5", desc: "Explica quais áreas STEAM foram utilizadas e por que a combinação faz sentido pedagógico." },
  { icon: "🔨", title: "Cultura Maker", color: "#10B981", desc: "Mostra onde o 'aprender fazendo' acontece na atividade e como conduzir os ciclos de construção." },
  { icon: "📋", title: "Competências BNCC", color: "#8B5CF6", desc: "Aponta quais habilidades e competências gerais da BNCC estão sendo desenvolvidas." },
  { icon: "🔧", title: "Como adaptar", color: "#F59E0B", desc: "Sugere como simplificar materiais, reduzir tempo ou aplicar com poucos recursos em escolas públicas." },
  { icon: "🎨", title: "Dica Criativa", color: "#EC4899", desc: "Propõe missões, desafios ou formatos que tornam a atividade mais envolvente e divertida." },
  { icon: "♿", title: "Inclusão", color: "#06B6D4", desc: "Orienta como adaptar para daltonismo, baixa visão e grupos colaborativos com diferentes ritmos." },
];

const FLOW_STEPS = [
  { num: "1", title: "Escreva o tema ou contexto", desc: "Um título simples já é suficiente — a IA interpreta e aprofunda para você." },
  { num: "2", title: "Escolha a disciplina e a série", desc: "A atividade será calibrada para a faixa etária e o currículo corretos." },
  { num: "3", title: "Selecione as competências STEAM", desc: "Escolha as áreas que quer integrar — a Cultura Maker estará sempre presente." },
  { num: "4", title: "Personalize para sua turma", desc: "Defina materiais, acessibilidade, avaliação e qualquer pedido especial." },
  { num: "5", title: "Gere e receba orientações pedagógicas", desc: "A IA cria a atividade e explica as escolhas com dicas visuais e práticas." },
];

const DESIGN_THINKING = [
  { icon: "🔍", phase: "Descoberta", desc: "Os alunos investigam o problema, coletam dados e entendem o contexto real." },
  { icon: "🎯", phase: "Definição", desc: "A turma delimita o desafio: o que exatamente precisa ser resolvido?" },
  { icon: "🔨", phase: "Desenvolvimento", desc: "Tempo de criar, construir, testar e melhorar — o coração do Maker." },
  { icon: "📢", phase: "Entrega", desc: "Apresentação, reflexão e avaliação do que foi aprendido e construído." },
];

const EXAMPLES = [
  { text: "Esta atividade trabalha Engenharia e Matemática porque os alunos precisarão testar estruturas e calcular equilíbrio." },
  { text: "A Cultura Maker aparece quando os alunos constroem, testam e melhoram seus próprios protótipos. O erro faz parte do aprendizado." },
  { text: "Você pode substituir materiais tecnológicos por papelão e recicláveis caso não tenha laboratório Maker." },
  { text: "Esta atividade desenvolve criatividade, resolução de problemas e trabalho em equipe — soft skills essenciais para o século XXI." },
];

export default function CreationTipsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guia de Criação de Atividades" size="large">
      <div style={s.container}>

        {/* Intro */}
        <div style={s.intro}>
          <p style={s.introText}>
            Este guia ajuda você a entender como o STEAM e a Cultura Maker funcionam — e como o sistema age como seu assistente pedagógico durante toda a criação da atividade.
          </p>
        </div>

        {/* STEAM */}
        <section style={s.section}>
          <div style={s.sectionLabel}>O que é STEAM?</div>
          <p style={s.sectionDesc}>
            STEAM integra Ciência, Tecnologia, Engenharia, Artes e Matemática em experiências de aprendizagem interdisciplinares. Você não abandona o currículo — transforma o conteúdo em um desafio real que o aluno quer resolver.
          </p>
          <div style={s.steamGrid}>
            {STEAM_AREAS.map((a) => (
              <div key={a.letter} style={{ ...s.steamCard, borderTop: `3px solid ${a.color}` }}>
                <div style={{ ...s.steamLetter, color: a.color }}>{a.letter}</div>
                <div style={s.steamName}>{a.name}</div>
                <div style={s.steamDesc}>{a.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Maker */}
        <section style={s.section}>
          <div style={s.sectionLabel}>Cultura Maker na prática</div>
          <p style={s.sectionDesc}>
            Maker é aprender fazendo. Em vez de receber conteúdo pronto, os alunos constroem, testam, erram e melhoram — desenvolvendo autonomia, criatividade e pensamento crítico.
          </p>
          <div style={s.makerGrid}>
            {MAKER_ELEMENTS.map((m) => (
              <div key={m.label} style={s.makerCard}>
                <span style={s.makerIcon}>{m.icon}</span>
                <div style={s.makerLabel}>{m.label}</div>
                <div style={s.makerDesc}>{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tip types */}
        <section style={s.section}>
          <div style={s.sectionLabel}>6 tipos de dicas que você recebe</div>
          <p style={s.sectionDesc}>
            Ao gerar uma atividade, o sistema exibe automaticamente orientações pedagógicas em 6 categorias:
          </p>
          <div style={s.tipGrid}>
            {TIP_TYPES.map((t) => (
              <div key={t.title} style={{ ...s.tipCard, borderLeft: `3px solid ${t.color}` }}>
                <div style={s.tipHeader}>
                  <span style={s.tipIcon}>{t.icon}</span>
                  <span style={{ ...s.tipTitle, color: t.color }}>{t.title}</span>
                </div>
                <div style={s.tipDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section style={s.section}>
          <div style={s.sectionLabel}>Fluxo de criação</div>
          <div style={s.flowList}>
            {FLOW_STEPS.map((step) => (
              <div key={step.num} style={s.flowItem}>
                <div style={s.flowNum}>{step.num}</div>
                <div>
                  <div style={s.flowTitle}>{step.title}</div>
                  <div style={s.flowDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Design Thinking */}
        <section style={s.section}>
          <div style={s.sectionLabel}>Design Thinking simplificado</div>
          <p style={s.sectionDesc}>
            As atividades seguem as quatro fases do Design Thinking adaptado para a sala de aula:
          </p>
          <div style={s.dtGrid}>
            {DESIGN_THINKING.map((d, i) => (
              <div key={d.phase} style={s.dtCard}>
                <div style={s.dtPhaseNum}>{i + 1}</div>
                <span style={s.dtIcon}>{d.icon}</span>
                <div style={s.dtPhase}>{d.phase}</div>
                <div style={s.dtDesc}>{d.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section style={s.section}>
          <div style={s.sectionLabel}>Exemplos de dicas</div>
          <div style={s.exampleList}>
            {EXAMPLES.map((e, i) => (
              <div key={i} style={s.exampleItem}>
                <span style={s.exampleQuote}>"</span>
                <span style={s.exampleText}>{e.text}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Modal>
  );
}

const s = {
  container: { display: "flex", flexDirection: "column", gap: "2rem", paddingBottom: "1rem" },
  intro: { padding: "1rem 1.125rem", background: "rgba(79,70,229,0.12)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: "10px" },
  introText: { fontSize: "0.92rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0 },
  section: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  sectionLabel: { fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)" },
  sectionDesc: { fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, margin: 0 },

  steamGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" },
  steamCard: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "0.85rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.3rem" },
  steamLetter: { fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 },
  steamName: { fontSize: "0.82rem", fontWeight: 700, color: "#1F2937" },
  steamDesc: { fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.5 },

  makerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" },
  makerCard: { background: "#F0FDF4", border: "1px solid #D1FAE5", borderRadius: "8px", padding: "0.85rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" },
  makerIcon: { fontSize: "1.3rem" },
  makerLabel: { fontSize: "0.82rem", fontWeight: 700, color: "#065F46" },
  makerDesc: { fontSize: "0.77rem", color: "#374151", lineHeight: 1.5 },

  tipGrid: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  tipCard: { background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.3rem" },
  tipHeader: { display: "flex", alignItems: "center", gap: "0.5rem" },
  tipIcon: { fontSize: "1rem" },
  tipTitle: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" },
  tipDesc: { fontSize: "0.83rem", color: "#374151", lineHeight: 1.55 },

  flowList: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  flowItem: { display: "flex", gap: "0.9rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" },
  flowNum: { width: "26px", height: "26px", borderRadius: "50%", background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0, marginTop: "1px" },
  flowTitle: { fontSize: "0.88rem", fontWeight: 700, color: "#1F2937", marginBottom: "0.2rem" },
  flowDesc: { fontSize: "0.81rem", color: "#6B7280", lineHeight: 1.5 },

  dtGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" },
  dtCard: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "0.9rem", display: "flex", flexDirection: "column", gap: "0.3rem", position: "relative" },
  dtPhaseNum: { position: "absolute", top: "0.65rem", right: "0.75rem", fontSize: "0.72rem", fontWeight: 800, color: "#D1D5DB" },
  dtIcon: { fontSize: "1.25rem" },
  dtPhase: { fontSize: "0.85rem", fontWeight: 700, color: "#1F2937" },
  dtDesc: { fontSize: "0.77rem", color: "#6B7280", lineHeight: 1.5 },

  exampleList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  exampleItem: { display: "flex", gap: "0.6rem", padding: "0.8rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", alignItems: "flex-start" },
  exampleQuote: { fontSize: "1.4rem", color: "#818CF8", fontWeight: 800, lineHeight: 1, flexShrink: 0, marginTop: "-2px" },
  exampleText: { fontSize: "0.86rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: "italic" },
};
