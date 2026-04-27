# ZapFlow Baileys Server

Servidor de integração WhatsApp usando [Baileys](https://github.com/WhiskeySockets/Baileys).

⚠️ **Aviso:** Baileys usa a API web não-oficial do WhatsApp. Pode resultar em banimento do número. Use por sua conta e risco.

## Deploy rápido no Railway

1. Crie um repositório no GitHub contendo apenas esta pasta `baileys-server/`
2. Acesse [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório
4. Em **Variables**, adicione:
   - `AUTH_TOKEN` = um token secreto qualquer (ex: `meu-token-123`)
5. Em **Settings → Networking** → **Generate Domain**
6. Copie a URL gerada (ex: `https://meu-app.up.railway.app`)
7. No ZapFlow, vá em **WhatsApp** → **Configurar**:
   - URL: `https://meu-app.up.railway.app`
   - Token: `meu-token-123`
8. Clique em **Conectar WhatsApp** e escaneie o QR Code

## Deploy local (teste)

```bash
cd baileys-server
npm install
AUTH_TOKEN=meu-token node server.js
```

Servidor sobe em `http://localhost:3001`.

## Persistência

A sessão do WhatsApp fica em `./sessions/<userId>/`. Em Railway, monte um Volume nessa pasta para não perder a sessão a cada redeploy.

## Endpoints

- `GET  /status?userId=xxx`
- `POST /connect { userId }`
- `POST /disconnect { userId }`
- `POST /send { userId, to, message }`

Todas as requisições requerem header `Authorization: Bearer <AUTH_TOKEN>` se a variável estiver definida.
