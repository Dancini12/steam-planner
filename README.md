# STEAM Planner - Configuração do Supabase

## 🚨 ERRO: "Invalid API key"

Se você está vendo o erro "Invalid API key" ao tentar criar uma conta, significa que o Supabase não está configurado corretamente.

## ✅ Modo Demo Temporário

Enquanto você configura o Supabase, o aplicativo está funcionando em **modo demonstração**:

- **Login demo**: `demo@demo.com` / `demo123`
- **Cadastro**: Simula criação de conta (não persiste dados)
- **Interface completa**: Todas as funcionalidades disponíveis

## 🔧 Como Configurar o Supabase

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login/cadastro
4. Clique em "New project"
5. Preencha:
   - **Name**: `steam-planner` (ou qualquer nome)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a mais próxima (ex: São Paulo)

### 2. Obter as Chaves API

1. No dashboard do projeto, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: Chave longa começando com `eyJ...`

### 3. Configurar o Arquivo .env

Edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC_AQUI
```

**Substitua:**
- `SEU_PROJETO` pela URL do seu projeto
- `SUA_CHAVE_ANON_PUBLIC_AQUI` pela chave copiada

### 4. Configurar Autenticação

1. No dashboard, vá em **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:5173` (para desenvolvimento)
   - **Redirect URLs**: Adicione `http://localhost:5173`
3. Em **Email Templates**, personalize os emails se desejar

### 5. Testar

1. Reinicie o servidor: `npm run dev`
2. Tente criar uma conta real
3. Verifique se recebe o email de confirmação

## 📧 Sobre Confirmação de Email

- O Supabase envia automaticamente um email de confirmação
- O usuário **não pode fazer login** até confirmar o email
- Verifique a caixa de spam se não receber

## 🔍 Verificar Configuração

Para testar se está funcionando:

```bash
# Verificar se as variáveis estão carregadas
node -e "console.log('URL:', process.env.VITE_SUPABASE_URL)"
```

## 🆘 Problemas Comuns

### "Invalid API key"
- Verifique se copiou a chave correta (anon public)
- Certifique-se de que não há espaços extras

### "Project not found"
- Verifique se a URL está correta
- Certifique-se de que o projeto existe e está ativo

### Email não chega
- Verifique caixa de spam
- Aguarde alguns minutos
- Teste com um email diferente

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Dashboard Supabase](https://supabase.com/dashboard)

---

**Após configurar corretamente, o modo demo será desabilitado automaticamente e você terá autenticação completa!** 🎉</content>
<parameter name="filePath">/Users/marceldancini/Desktop/steam-planner/SUPABASE_SETUP.md