// ============================================================
// main.jsx
// Ponto de entrada do React no app
// ============================================================
//
// Este é o arquivo mais simples e mais crítico do projeto.
// Sua única função é "ligar" o componente App ao elemento
// <div id="root"> do index.html, fazendo o React entrar
// em ação no navegador.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
