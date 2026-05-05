# Deploy na Vercel

Este projeto esta pronto para deploy na Vercel como um app Vite.

## Configuracao do projeto

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Development command: `npm run dev`

## Arquivos importantes

O `.gitignore` deve manter fora do repositorio:

```gitignore
node_modules
dist
.env
.DS_Store
```

O `package.json` deve conter:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

## Validar localmente

Instale as dependencias:

```bash
npm install
```

Rode o projeto em desenvolvimento:

```bash
npm run dev
```

Gere o build de producao:

```bash
npm run build
```

Teste o build localmente:

```bash
npm run preview
```

Depois do build, a pasta `dist` deve ser criada com `index.html` e assets em `dist/assets`.

## Deploy pela Vercel

1. Suba o projeto para o GitHub:

```bash
git add .
git commit -m "Prepare project for Vercel deploy"
git push origin main
```

2. Acesse a Vercel:

```text
https://vercel.com
```

3. Entre com sua conta GitHub.

4. Clique em `Add New...` e depois `Project`.

5. Importe o repositorio do projeto.

6. Confira as configuracoes:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

7. Se o projeto usa variaveis de ambiente, configure em:

```text
Project Settings > Environment Variables
```

8. Clique em `Deploy`.

## Variaveis de ambiente

No Vite, variaveis expostas ao frontend precisam comecar com `VITE_`.

Exemplo local em `.env`:

```bash
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Na Vercel, cadastre as mesmas chaves em `Environment Variables`. Depois de alterar variaveis, faca um novo deploy.

## Erros comuns

### Caminhos incorretos

Use imports relativos ou aliases configurados no `vite.config.js`. Evite caminhos absolutos do computador, como:

```js
import file from "/Users/seu-usuario/projeto/src/file";
```

### Assets nao aparecem

Para arquivos importados em componentes, prefira colocar assets em `src/assets` e importar:

```js
import logo from "../assets/logo.png";
```

Para arquivos estaticos servidos diretamente, coloque em `public` e referencie pela raiz:

```html
<img src="/logo.png" />
```

### Variaveis undefined em producao

Confirme que o nome comeca com `VITE_`, que foi cadastrado na Vercel e que o deploy foi refeito depois da alteracao.

### Build funciona localmente, mas falha na Vercel

Rode localmente:

```bash
npm install
npm run build
```

Corrija qualquer erro exibido antes de tentar novo deploy.

## Melhorias recomendadas para producao

- Revisar tamanho do bundle se ele crescer muito.
- Separar imagens e arquivos estaticos em `src/assets` ou `public`.
- Usar lazy loading em paginas pesadas com `React.lazy`.
- Manter segredos apenas em variaveis de ambiente, nunca no codigo.
- Testar o build com `npm run preview` antes de publicar.
