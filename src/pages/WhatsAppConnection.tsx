import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, QrCode, RefreshCw, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const WhatsAppConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [serverConfig, setServerConfig] = useState<{ url: string; token: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const pollRef = useRef<number | null>(null);

  const isConfigured = !!serverConfig?.url;
  const isConnected = session?.status === "connected";

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [{ data: sess }, { data: settings }] = await Promise.all([
      supabase.from("whatsapp_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("system_settings").select("value").eq("key", "whatsapp_server").maybeSingle(),
    ]);
    setSession(sess);
    const v = (settings?.value as any) || {};
    setServerConfig(v.url ? { url: v.url, token: v.token || "" } : null);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const callServer = useCallback(async (path: string, method: string = "GET", body?: any) => {
    if (!serverConfig?.url) throw new Error("Servidor não configurado");
    const cleanUrl = serverConfig.url.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(serverConfig.token ? { "Authorization": `Bearer ${serverConfig.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [serverConfig]);

  const checkStatus = useCallback(async () => {
    if (!isConfigured || !user) return;
    try {
      const data = await callServer(`/status?userId=${user.id}`);
      setServerStatus("online");
      if (data.qr) setQrCode(data.qr);

      if (data.connected && session?.status !== "connected") {
        let sid = session?.id;
        if (!sid) {
          const { data: created } = await supabase.from("whatsapp_sessions").insert({
            user_id: user.id, status: "connected", phone_number: data.phone || null, connected_at: new Date().toISOString(),
          }).select().single();
          sid = created?.id;
        } else {
          await supabase.from("whatsapp_sessions").update({
            status: "connected", phone_number: data.phone || null, connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          }).eq("id", sid);
        }
        await supabase.from("notifications").insert({
          user_id: user.id, title: "WhatsApp Conectado",
          description: `Número ${data.phone || ""} conectado com sucesso`, type: "success",
        });
        setQrCode(null);
        await loadAll();
      } else if (!data.connected && session?.status === "connected") {
        await supabase.from("whatsapp_sessions").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", session.id);
        await loadAll();
      }
    } catch {
      setServerStatus("offline");
    }
  }, [isConfigured, user, session, callServer, loadAll]);

  useEffect(() => {
    if (!isConfigured) return;
    checkStatus();
    pollRef.current = window.setInterval(checkStatus, 3000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [isConfigured, checkStatus]);

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
    try { await callServer("/disconnect", "POST", { userId: user.id }); } catch { /* ignore */ }
    await supabase.from("whatsapp_sessions").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", session.id);
    setQrCode(null);
    toast({ title: "WhatsApp desconectado" });
    await loadAll();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Conectar WhatsApp</h2>
          <p className="text-muted-foreground mt-1">Escaneie o QR Code com seu WhatsApp para conectar</p>
        </div>

        {!isConfigured && (
          <Card className="shadow-card border-destructive/30">
            <CardContent className="pt-6 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="font-medium text-foreground">Servidor não configurado</p>
              <p className="text-sm text-muted-foreground">
                O administrador do sistema ainda não configurou o servidor WhatsApp. Entre em contato com o suporte.
              </p>
            </CardContent>
          </Card>
        )}

        {isConfigured && (
          <Card className={`shadow-card ${isConnected ? "border-primary/30" : ""}`}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-2">
                {isConnected ? <Wifi className="w-10 h-10 text-primary-foreground" /> : <WifiOff className="w-10 h-10 text-primary-foreground" />}
              </div>
              <CardTitle className="text-xl">{isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}</CardTitle>
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
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=${encodeURIComponent(qrCode)}`} alt="QR Code" className="w-56 h-56" />
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
                  <AlertCircle className="w-4 h-4" /> Servidor offline. Avise o administrador.
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {isConnected ? (
                  <Button variant="destructive" onClick={handleDisconnect}>Desconectar</Button>
                ) : (
                  <Button variant="default" size="lg" onClick={handleConnect} disabled={loading || serverStatus === "offline"}>
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
