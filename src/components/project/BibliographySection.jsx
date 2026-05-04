import React from "react";
import Card from "../ui/Card";
import "./BibliographySection.css";

export default function BibliographySection({ bibliography = [] }) {
  if (!bibliography || bibliography.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="bibliography-section">
        <h3 className="bibliography-title">📚 Referências Bibliográficas</h3>

        <p className="bibliography-subtitle">
          Materiais de apoio para aprofundamento do conteúdo (Formato ABNT)
        </p>

        <ul className="bibliography-list">
          {bibliography.map((reference, index) => (
            <li key={index} className="bibliography-item">
              <span className="bibliography-number">{index + 1}.</span>
              <p className="bibliography-text">{reference}</p>
            </li>
          ))}
        </ul>

        <div className="bibliography-info">
          <p className="info-text">
            ℹ️ Essas referências foram sugeridas pela IA com base no tema e áreas STEAM do projeto.
            Recomenda-se verificar a disponibilidade desses materiais em sua biblioteca escolar ou em plataformas
            de pesquisa acadêmica.
          </p>
        </div>
      </div>
    </Card>
  );
}
