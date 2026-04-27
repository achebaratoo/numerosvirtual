import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, WifiOff, QrCode, RefreshCw, Smartphone, Server, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SessionData {
  server_url?: string;
  server_token?: string;
}

const WhatsAppConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState("");
  const [serverToken, setServerToken] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [serverStatus, setServerStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const pollRef = useRef<number | null>(null);

  const sessionData: SessionData = (session?.session_data as SessionData) || {};
  const isConfigured = !!sessionData.server_url;
  const isConnected = session?.status === "connected";

  const loadSession = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession(data);
    const sd = (data?.session_data as SessionData) || {};
    if (sd.server_url) setServerUrl(sd.server_url);
    if (sd.server_token) setServerToken(sd.server_token);
  }, [user]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Helper to call the user's Baileys server
  const callServer = useCallback(async (path: string, method: string = "GET", body?: any) => {
    const url = sessionData.server_url;
    if (!url) throw new Error("Servidor não configurado");
    const cleanUrl = url.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(sessionData.server_token ? { "Authorization": `Bearer ${sessionData.server_token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [sessionData.server_url, sessionData.server_token]);

  // Poll server status when configured
  const checkStatus = useCallback(async () => {
    if (!isConfigured || !user) return;
    try {
      const data = await callServer(`/status?userId=${user.id}`);
      setServerStatus("online");

      if (data.qr) setQrCode(data.qr);

      if (data.connected && session?.status !== "connected") {
        await supabase.from("whatsapp_sessions").update({
          status: "connected",
          phone_number: data.phone || null,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", session.id);
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "WhatsApp Conectado",
          description: `Número ${data.phone || ""} conectado com sucesso`,
          type: "success",
        });
        setQrCode(null);
        await loadSession();
      } else if (!data.connected && session?.status === "connected") {
        await supabase.from("whatsapp_sessions").update({
          status: "disconnected",
          updated_at: new Date().toISOString(),
        }).eq("id", session.id);
        await loadSession();
      }
    } catch (e) {
      setServerStatus("offline");
    }
  }, [isConfigured, user, session, callServer, loadSession]);

  // Poll every 3s when configured
  useEffect(() => {
    if (!isConfigured) return;
    checkStatus();
    pollRef.current = window.setInterval(checkStatus, 3000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [isConfigured, checkStatus]);

  const saveServerConfig = async () => {
    if (!user) return;
    if (!serverUrl.trim()) {
      toast({ title: "URL obrigatória", description: "Informe a URL do seu servidor Baileys", variant: "destructive" });
      return;
    }
    setLoading(true);
    const newSessionData = { server_url: serverUrl.trim(), server_token: serverToken.trim() };
    if (session) {
      await supabase.from("whatsapp_sessions").update({
        session_data: newSessionData,
        updated_at: new Date().toISOString(),
      }).eq("id", session.id);
    } else {
      await supabase.from("whatsapp_sessions").insert({
        user_id: user.id,
        status: "disconnected",
        session_data: newSessionData,
      });
    }
    toast({ title: "✅ Servidor configurado" });
    setShowConfig(false);
    setLoading(false);
    await loadSession();
  };

  const handleConnect = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await callServer("/connect", "POST", { userId: user.id });
      toast({ title: "Iniciando conexão...", description: "Aguarde o QR Code aparecer" });
      setTimeout(checkStatus, 1500);
    } catch (e: any) {
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!session || !user) return;
    try {
      await callServer("/disconnect", "POST", { userId: user.id });
    } catch {
      // ignore server error, still mark as disconnected locally
    }
    await supabase.from("whatsapp_sessions").update({
      status: "disconnected",
      updated_at: new Date().toISOString(),
    }).eq("id", session.id);
    setQrCode(null);
    toast({ title: "WhatsApp desconectado" });
    await loadSession();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Conexão WhatsApp</h2>
          <p className="text-muted-foreground mt-1">Conecte seu WhatsApp real via servidor Baileys</p>
        </div>

        {/* Server config card */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4" />
              Servidor Baileys
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConfigured && (
                <Badge variant={serverStatus === "online" ? "default" : "destructive"}>
                  {serverStatus === "online" ? "● Online" : serverStatus === "offline" ? "● Offline" : "● ..."}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
                {isConfigured ? "Editar" : "Configurar"}
              </Button>
            </div>
          </CardHeader>
          {(showConfig || !isConfigured) && (
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="url">URL do Servidor</Label>
                <Input
                  id="url"
                  placeholder="https://seu-baileys.up.railway.app"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="token">Token (opcional)</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Bearer token de autenticação"
                  value={serverToken}
                  onChange={(e) => setServerToken(e.target.value)}
                />
              </div>
              <Button onClick={saveServerConfig} disabled={loading} className="w-full">
                Salvar configuração
              </Button>
              <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg space-y-1">
                <p className="flex items-center gap-1 font-medium text-foreground">
                  <AlertCircle className="w-3 h-3" /> Você precisa hospedar um servidor Baileys
                </p>
                <p>Use o arquivo <code className="bg-background px-1 rounded">baileys-server/server.js</code> incluído neste projeto. Hospede em Railway, Render, Fly.io ou VPS, e cole a URL pública aqui.</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Connection status */}
        {isConfigured && (
          <Card className={`shadow-card ${isConnected ? "border-primary/30" : ""}`}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-2">
                {isConnected ? <Wifi className="w-10 h-10 text-primary-foreground" /> : <WifiOff className="w-10 h-10 text-primary-foreground" />}
              </div>
              <CardTitle className="text-xl">
                {isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-sm px-4 py-1">
                {isConnected ? "● Conectado" : "○ Desconectado"}
              </Badge>

              {isConnected && session?.phone_number && (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="font-mono">{session.phone_number}</span>
                </div>
              )}

              {qrCode && !isConnected && (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-3">Escaneie o QR Code com seu WhatsApp:</p>
                  <div className="inline-block p-4 bg-white rounded-xl">
                    {qrCode.startsWith("data:image") ? (
                      <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=${encodeURIComponent(qrCode)}`}
                        alt="QR Code"
                        className="w-56 h-56"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho
                  </p>
                </div>
              )}

              {!qrCode && !isConnected && serverStatus === "online" && (
                <div className="py-4 text-center">
                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique em conectar para gerar o QR Code</p>
                </div>
              )}

              {serverStatus === "offline" && (
                <div className="py-4 flex items-center justify-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Servidor offline. Verifique a URL configurada.
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {isConnected ? (
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Desconectar
                  </Button>
                ) : (
                  <Button variant="hero" size="lg" onClick={handleConnect} disabled={loading || serverStatus === "offline"}>
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    {loading ? "Conectando..." : "Conectar WhatsApp"}
                  </Button>
                )}
              </div>

              {isConnected && session?.connected_at && (
                <p className="text-xs text-muted-foreground">
                  Conectado desde {new Date(session.connected_at).toLocaleString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppConnection;
