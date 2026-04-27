/**
 * Servidor Baileys para integração com ZapFlow
 * ----------------------------------------------
 * Este servidor NÃO roda dentro da Lovable Cloud.
 * Você precisa hospedá-lo separadamente em:
 *   - Railway (https://railway.app) — mais fácil
 *   - Render (https://render.com)
 *   - Fly.io (https://fly.io)
 *   - VPS própria (DigitalOcean, Hetzner, etc.)
 *
 * COMO USAR:
 * 1. Faça upload desta pasta `baileys-server/` para um repositório GitHub
 * 2. Conecte o repo no Railway/Render
 * 3. Defina a variável de ambiente AUTH_TOKEN (opcional, mas recomendado)
 * 4. Após deploy, copie a URL pública (ex: https://meu-app.up.railway.app)
 * 5. Cole essa URL na tela "Conexão WhatsApp" do ZapFlow
 *
 * ENDPOINTS:
 *   GET  /status?userId=xxx       → { connected, qr, phone }
 *   POST /connect  { userId }     → inicia conexão / gera QR
 *   POST /disconnect { userId }   → desconecta
 *   POST /send { userId, to, message } → envia mensagem
 *
 * AVISO: Baileys usa a API web não-oficial do WhatsApp e PODE
 * resultar em banimento do número. Use por sua conta e risco.
 */

import express from "express";
import cors from "cors";
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const AUTH_TOKEN = process.env.AUTH_TOKEN || "";
const PORT = process.env.PORT || 3001;
const SESSIONS_DIR = process.env.SESSIONS_DIR || "./sessions";

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Map<userId, { sock, qr, connected, phone }>
const sessions = new Map();

// Auth middleware
app.use((req, res, next) => {
  if (!AUTH_TOKEN) return next();
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

async function startSession(userId) {
  if (sessions.has(userId) && sessions.get(userId).connected) return sessions.get(userId);

  const sessionPath = path.join(SESSIONS_DIR, userId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["ZapFlow", "Chrome", "1.0.0"],
  });

  const sessionInfo = { sock, qr: null, connected: false, phone: null };
  sessions.set(userId, sessionInfo);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessionInfo.qr = await qrcode.toDataURL(qr);
      console.log(`[${userId}] QR gerado`);
    }

    if (connection === "open") {
      sessionInfo.connected = true;
      sessionInfo.qr = null;
      sessionInfo.phone = sock.user?.id?.split(":")[0]?.replace(/^/, "+") || null;
      console.log(`[${userId}] Conectado: ${sessionInfo.phone}`);
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      sessionInfo.connected = false;
      sessionInfo.phone = null;
      console.log(`[${userId}] Desconectado. Reconectar: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(() => startSession(userId), 3000);
      } else {
        sessions.delete(userId);
        // Clear stored creds on logout
        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch {}
      }
    }
  });

  // Forward incoming messages (optional: post to your Supabase webhook)
  sock.ev.on("messages.upsert", ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      console.log(`[${userId}] Mensagem de ${msg.key.remoteJid}`);
      // TODO: opcional — POST para um edge function que insira em `messages` e `notifications`
    }
  });

  return sessionInfo;
}

app.get("/status", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "userId required" });
  const s = sessions.get(userId);
  if (!s) return res.json({ connected: false, qr: null, phone: null });
  res.json({ connected: s.connected, qr: s.qr, phone: s.phone });
});

app.post("/connect", async (req, res) => {
  const userId = req.body?.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    await startSession(userId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/disconnect", async (req, res) => {
  const userId = req.body?.userId;
  const s = sessions.get(userId);
  if (s?.sock) {
    try { await s.sock.logout(); } catch {}
  }
  sessions.delete(userId);
  try {
    fs.rmSync(path.join(SESSIONS_DIR, userId), { recursive: true, force: true });
  } catch {}
  res.json({ ok: true });
});

app.post("/send", async (req, res) => {
  const { userId, to, message } = req.body || {};
  if (!userId || !to || !message) return res.status(400).json({ error: "userId, to, message required" });
  const s = sessions.get(userId);
  if (!s?.connected) return res.status(400).json({ error: "Not connected" });
  try {
    const jid = to.includes("@") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
    await s.sock.sendMessage(jid, { text: message });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/", (_req, res) => res.json({ name: "ZapFlow Baileys Server", status: "running" }));

app.listen(PORT, () => console.log(`Baileys server on :${PORT}`));
