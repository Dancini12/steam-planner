import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { registerUserProfile, trackEvent } from "../lib/analytics.js";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";

function getAuthErrorMessage(error) {
  const message = error?.message || "Erro desconhecido.";
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }

  if (normalized.includes("weak password") || normalized.includes("password")) {
    return "Senha fraca. Use uma senha mais longa e segura.";
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Erro de rede. Verifique sua conexão e tente novamente.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.";
  }

  return message;
}

async function saveProfile(user) {
  if (supabase && user?.id && user?.email) {
    const { error } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email
      }
    ]);

    if (error) {
      console.warn("Perfil opcional nao foi salvo em profiles:", error.message);
    }

    return;
  }

  console.warn("Supabase indisponível");
}

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  // Estado do formulário de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Estado do formulário de cadastro
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupSchool, setSignupSchool] = useState("");
  const [signupArea, setSignupArea] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  // Validação de e-mail simples
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Preencha todos os campos");
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setLoginError("E-mail inválido");
      return;
    }

    try {
      if (supabase) {
        console.log("Login: iniciando signInWithPassword", { email: loginEmail });
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        console.log("Login: resposta Supabase", { data, error });

        if (error) {
          const errorMessage = getAuthErrorMessage(error);
          console.error("Erro no login:", error.message);
          alert(errorMessage);
          setLoginError(errorMessage);
          return;
        }

        console.log("Login realizado:", data);

        if (data.user) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split("@")[0],
            school: data.user.user_metadata?.school,
            area: data.user.user_metadata?.area
          };

          console.log("Login bem-sucedido:", userData);
          await registerUserProfile(data.user);
          await trackEvent(data.user.id, "login");
          onLogin(userData);
        }

        return;
      }

      console.warn("Supabase indisponível");
      setLoginError("Serviço de login temporariamente indisponível.");
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      const errorMessage = getAuthErrorMessage(error);
      alert(errorMessage);
      setLoginError(errorMessage);
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (!signupName || !signupEmail || !signupSchool || !signupArea) {
      setSignupError("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isValidEmail(signupEmail)) {
      setSignupError("E-mail inválido");
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError("Senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setSignupError("As senhas não conferem");
      return;
    }

    try {
      if (supabase) {
        console.log("Cadastro: iniciando signUp", { email: signupEmail });
        const { data, error } = await supabase.auth.signUp({
          email: signupEmail,
          password: signupPassword,
          options: {
            data: {
              name: signupName,
              school: signupSchool,
              area: signupArea,
            }
          }
        });

        console.log("Cadastro: resposta Supabase", { data, error });

        if (error) {
          const errorMessage = getAuthErrorMessage(error);
          console.error("Erro no cadastro:", error.message);
          alert(errorMessage);
          setSignupError(errorMessage);
          return;
        }

        console.log("Usuário criado:", data);

        if (data.user) {
          await registerUserProfile(data.user);
          await saveProfile(data.user);
          await trackEvent(data.user.id, "signup");
        }

        if (data.session && data.user) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split("@")[0],
            school: data.user.user_metadata?.school,
            area: data.user.user_metadata?.area
          };
          alert("Cadastro realizado com sucesso!");
          onLogin(userData);
          return;
        }

        if (data.user && !data.user.email_confirmed_at) {
          setSignupSuccess(
            "Cadastro realizado! Um link de confirmação foi enviado para seu e-mail. " +
            "Verifique sua caixa de entrada e clique no link para ativar sua conta."
          );
          alert("Cadastro realizado com sucesso!");

          // Limpa os campos
          setSignupName("");
          setSignupEmail("");
          setSignupSchool("");
          setSignupArea("");
          setSignupPassword("");
          setSignupPasswordConfirm("");
        } else {
          setSignupSuccess("Conta criada com sucesso! Você pode fazer login agora.");
          alert("Cadastro realizado com sucesso!");
        }

        return;
      }

      console.warn("Supabase indisponível");
      setSignupError("Serviço de cadastro temporariamente indisponível.");
    } catch (error) {
      console.error("Erro inesperado:", error);
      const errorMessage = getAuthErrorMessage(error);
      alert(errorMessage);
      setSignupError(errorMessage);
    }
  };

  // Estilos básicos para teste
  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0F0F2D",
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(107, 47, 224, 0.25), transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(232, 53, 138, 0.15), transparent 50%)
    `,
    padding: "1rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    maxWidth: "440px",
    width: "100%",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  };

  const footerStyle = {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.52)",
    lineHeight: 1.6
  };

  const aboutButtonStyle = {
    width: "100%",
    marginTop: "0.35rem",
    padding: "12px 16px",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: "10px",
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  const aboutTextStyle = {
    color: "rgba(255, 255, 255, 0.72)",
    lineHeight: 1.65,
    fontSize: "0.95rem",
    margin: "0 0 1rem",
    textAlign: "justify"
  };

  const aboutSectionTitleStyle = {
    margin: "1.1rem 0 0.45rem",
    color: "#FFFFFF",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  };

  const aboutListStyle = {
    color: "rgba(255, 255, 255, 0.78)",
    lineHeight: 1.7,
    fontSize: "0.92rem",
    margin: "0 0 1.25rem",
    paddingLeft: "1.2rem"
  };

  const logoStyle = {
    width: "100%",
    maxWidth: "380px",
    height: "auto",
    display: "block",
    margin: "0 auto"
  };

  const logoContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "250px",
    marginBottom: "1rem"
  };

  const subtitleStyle = {
    fontSize: "16px",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: "2rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  const bigButtonStyle = {
    width: "100%",
    padding: "16px 24px",
    background: "#6B2FE0",
    border: "none",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "1rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  const secondaryButtonStyle = {
    width: "100%",
    padding: "16px 24px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  const backButtonStyle = {
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 0",
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo sempre visível */}
        <div style={logoContainerStyle}>
          <svg
            viewBox="0 0 380 245"
            xmlns="http://www.w3.org/2000/svg"
            style={logoStyle}
          >
            <defs>
              <style>
                {`
                  @keyframes drawPath {
                    0% { stroke-dasharray: 0, 1000; }
                    100% { stroke-dasharray: 1000, 0; }
                  }
                  path {
                    animation: drawPath 2.5s ease-in-out forwards;
                  }
                  path:nth-child(1) { animation-delay: 0s; }
                  path:nth-child(2) { animation-delay: 0.12s; }
                  path:nth-child(3) { animation-delay: 0.24s; }
                  path:nth-child(4) { animation-delay: 0.36s; }
                  path:nth-child(5) { animation-delay: 0.48s; }
                  path:nth-child(6) { animation-delay: 0.6s; }
                  path:nth-child(7) { animation-delay: 0.72s; }
                  path:nth-child(8) { animation-delay: 0.84s; }
                  path:nth-child(9) { animation-delay: 0.96s; }
                  path:nth-child(10) { animation-delay: 1.08s; }
                  path:nth-child(11) { animation-delay: 1.2s; }
                  path:nth-child(12) { animation-delay: 1.32s; }
                  path:nth-child(13) { animation-delay: 1.44s; }
                  path:nth-child(14) { animation-delay: 1.56s; }
                  path:nth-child(15) { animation-delay: 1.68s; }
                  path:nth-child(16) { animation-delay: 1.8s; }
                `}
              </style>
            </defs>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="11">
              <path
                d="M 60 35 C 58 18, 38 14, 22 22 C 8 32, 12 52, 32 56 C 56 62, 68 72, 64 92 C 58 112, 32 116, 18 108 C 12 104, 10 98, 10 94"
                stroke="#3FD64C"
              />
              <path d="M 82 22 C 92 18, 110 18, 130 22" stroke="#3B95F2" />
              <path d="M 106 22 C 104 50, 104 80, 108 116" stroke="#3B95F2" />
              <path
                d="M 152 116 C 154 90, 156 60, 162 28 C 178 22, 200 22, 218 26 M 156 68 C 168 64, 184 64, 200 68 M 152 116 C 174 112, 198 112, 222 116"
                stroke="#FF8C1A"
              />
              <path
                d="M 240 116 C 246 88, 256 56, 268 26 C 282 56, 290 88, 296 116 M 250 88 C 264 84, 280 84, 290 88"
                stroke="#E8358A"
              />
              <path
                d="M 320 116 C 318 88, 318 56, 320 26 C 330 50, 342 76, 348 88 C 356 76, 366 50, 372 26 C 374 56, 374 88, 372 116"
                stroke="#A050F0"
              />
              <path
                d="M 16 228 C 14 202, 14 176, 18 150 C 28 172, 40 194, 48 208 C 58 190, 68 170, 76 150 C 78 176, 78 202, 76 228"
                stroke="#3FD64C"
              />
              <path
                d="M 96 228 C 102 202, 110 174, 120 150 C 132 176, 140 202, 146 228 M 104 202 C 116 198, 130 198, 140 202"
                stroke="#3B95F2"
              />
              <path
                d="M 166 228 C 164 202, 164 176, 166 150 C 184 150, 202 154, 204 174 C 206 190, 188 196, 170 194 M 184 194 C 194 206, 202 218, 210 228"
                stroke="#FF8C1A"
              />
              <path
                d="M 232 150 C 230 174, 230 204, 234 228 M 212 150 C 224 148, 244 148, 258 150"
                stroke="#E8358A"
              />
              <path
                d="M 278 150 C 276 176, 276 202, 278 228 M 278 190 C 292 176, 306 164, 320 150 M 288 190 C 300 202, 312 216, 324 228"
                stroke="#A050F0"
              />
              <path
                d="M 342 228 C 340 202, 340 176, 342 150 C 356 150, 372 154, 374 172 C 376 190, 360 196, 346 194 M 360 194 C 366 206, 372 218, 378 228"
                stroke="#3FD64C"
              />
              <path
                d="M 18 238 C 40 236, 62 236, 84 238"
                stroke="#3B95F2"
              />
              <path
                d="M 108 238 C 130 236, 154 236, 176 238"
                stroke="#FF8C1A"
              />
              <path
                d="M 200 238 C 222 236, 246 236, 268 238"
                stroke="#E8358A"
              />
              <path
                d="M 292 238 C 316 236, 342 236, 366 238"
                stroke="#A050F0"
              />
            </g>
          </svg>
        </div>

        {/* Subtítulo */}
        <div style={subtitleStyle}>Planejamento, prototipagem e avaliação em fases</div>

        {activeTab === null && (
          <div style={{ textAlign: "center" }}>
            <button
              style={bigButtonStyle}
              onClick={() => setActiveTab("signin")}
            >
              Fazer login
            </button>
            <button
              style={secondaryButtonStyle}
              onClick={() => setActiveTab("signup")}
            >
              Criar conta
            </button>
            <button
              style={aboutButtonStyle}
              onClick={() => setShowAbout(true)}
            >
              Sobre o site
            </button>
          </div>
        )}

        {activeTab !== null && (
          <>
            <button
              style={backButtonStyle}
              onClick={() => {
                setActiveTab(null);
                setLoginError("");
                setSignupError("");
                setSignupSuccess("");
              }}
            >
              ← Voltar
            </button>

            {activeTab === "signin" && (
              <form onSubmit={handleLogin}>
                {loginError && <div style={{ color: "red", marginBottom: "1rem" }}>{loginError}</div>}

                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="seu.email@escola.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <label>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    background: "#6B2FE0",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  Entrar
                </button>
              </form>
            )}

            {activeTab === "signup" && (
              <form onSubmit={handleSignup}>
                {signupError && <div style={{ color: "red", marginBottom: "1rem" }}>{signupError}</div>}
                {signupSuccess && <div style={{ color: "green", marginBottom: "1rem" }}>{signupSuccess}</div>}

                <label>Nome completo *</label>
                <input
                  type="text"
                  placeholder="João da Silva"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <label>E-mail institucional *</label>
                <input
                  type="email"
                  placeholder="joao@escola.edu.br"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <label>Escola onde leciona *</label>
                <input
                  type="text"
                  placeholder="Escola Estadual João Pessoa"
                  value={signupSchool}
                  onChange={(e) => setSignupSchool(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <label>Área de atuação *</label>
                <select
                  value={signupArea}
                  onChange={(e) => setSignupArea(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                >
                  <option value="">Selecione...</option>
                  <option value="ciencias">Ciências</option>
                  <option value="matematica">Matemática</option>
                  <option value="tecnologia">Tecnologia / Informática</option>
                  <option value="artes">Artes</option>
                  <option value="engenharia">Engenharia / Robótica</option>
                  <option value="pedagogia">Pedagogia</option>
                  <option value="outra">Outra</option>
                </select>

                <label>Senha *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <label>Confirmar senha *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
                />

                <div style={{
                  background: "rgba(107, 47, 224, 0.08)",
                  border: "1px solid rgba(107, 47, 224, 0.3)",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  fontSize: "13px"
                }}>
                  ℹ️ Após o cadastro, enviaremos um link de confirmação para o seu e-mail. Sua conta será ativada quando você clicar no link.
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    background: "#6B2FE0",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  Criar minha conta
                </button>
              </form>
            )}
          </>
        )}

        <div style={footerStyle}>
          <div>Mestrando: Marcel Dancini Rodrigues</div>
          <div>Orientador: Prof. Dr. João Coelho Neto</div>
        </div>

        <Modal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
          title="Sobre o STEAM Planner"
          maxWidth="560px"
        >
          <div style={aboutSectionTitleStyle}>Finalidade</div>
          <p style={aboutTextStyle}>
            O STEAM Planner é uma plataforma educacional destinada ao
            planejamento, acompanhamento, registro e avaliação de projetos
            pedagógicos fundamentados na metodologia STEAM, que integra
            Ciências, Tecnologia, Engenharia, Artes e Matemática em propostas
            interdisciplinares, investigativas e contextualizadas.
          </p>
          <div style={aboutSectionTitleStyle}>Importância pedagógica</div>
          <p style={aboutTextStyle}>
            A utilização da metodologia STEAM contribui para a organização de
            práticas educativas voltadas à resolução de problemas, ao pensamento
            crítico, à criatividade, à colaboração e à aplicação do conhecimento
            em situações reais. Nesse sentido, o site busca apoiar o professor
            na estruturação de projetos que aproximem os estudantes de processos
            de investigação, criação, prototipagem, testagem e socialização dos
            resultados.
          </p>
          <div style={aboutSectionTitleStyle}>Funcionalidades</div>
          <ul style={aboutListStyle}>
            <li>Organização do projeto em fases: imersão, ideação, prototipagem, teste e compartilhamento.</li>
            <li>Registro do diário de bordo com datas, observações e acompanhamento do desenvolvimento das atividades.</li>
            <li>Apoio à avaliação em fases, com registro de indicadores, instrumentos, evidências e devolutivas.</li>
            <li>Cadastro de referências bibliográficas, geração de relatórios e consulta a projetos prontos por usuários cadastrados.</li>
          </ul>
          <div style={aboutSectionTitleStyle}>Identificação acadêmica</div>
          <p style={aboutTextStyle}>
            Mestrando: Marcel Dancini Rodrigues.
            <br />
            Orientador: Prof. Dr. João Coelho Neto.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={() => setShowAbout(false)}>
              Entendi
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
