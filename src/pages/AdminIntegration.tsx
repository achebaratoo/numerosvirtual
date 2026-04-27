import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Server, CheckCircle2, XCircle, RefreshCw, AlertCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminIntegration = () => {
  const { toast } = useToast();
  const [serverUrl, setServerUrl] = useState("");
  const [serverToken, setServerToken] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [status, setStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "whatsapp_server")
      .maybeSingle();
    const v = (data?.value as any) || {};
    setSavedUrl(v.url || "");
    setSavedToken(v.token || "");
    setServerUrl(v.url || "");
    setServerToken(v.token || "");
  };

  useEffect(() => { load(); }, []);

  const testConnection = useCallback(async (url: string, token: string) => {
    if (!url) return;
    setTesting(true);
    try {
      const cleanUrl = url.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/health`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
    setTesting(false);
  }, []);

  useEffect(() => {
    if (savedUrl) testConnection(savedUrl, savedToken);
  }, [savedUrl, savedToken, testConnection]);

  const save = async () => {
    if (!serverUrl.trim()) {
      toast({ title: "URL obrigatória", description: "Informe a URL do servidor Baileys", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .update({
        value: { url: serverUrl.trim(), token: serverToken.trim() },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "whatsapp_server");
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Servidor configurado", description: "Os usuários já podem escanear o QR Code" });
    setSavedUrl(serverUrl.trim());
    setSavedToken(serverToken.trim());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integração de Servidor</h2>
          <p className="text-muted-foreground">Configure o servidor Baileys global usado por todos os usuários</p>
        </div>

        {/* Flow guide */}
        <Card className="shadow-card border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Como funciona o fluxo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-3"><span className="font-bold text-primary">1.</span><p><strong>Você (admin)</strong> hospeda o servidor Baileys (Railway, VPS, Render…) e cola a URL aqui.</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">2.</span><p>O sistema testa a conexão automaticamente — se ficar verde está OK.</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">3.</span><p><strong>Os usuários</strong> entram em "WhatsApp" e veem apenas o QR Code (sem precisar configurar nada).</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">4.</span><p>Cada usuário escaneia com o WhatsApp dele e fica conectado em sessão isolada.</p></div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4" /> Configuração do Servidor
            </CardTitle>
            {savedUrl && (
              <Badge variant={status === "online" ? "default" : "destructive"} className="gap-1">
                {status === "online" ? <><CheckCircle2 className="w-3 h-3" /> Online</> : status === "offline" ? <><XCircle className="w-3 h-3" /> Offline</> : "..."}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url">URL do Servidor / API *</Label>
              <Input
                id="url"
                placeholder="https://meu-baileys.up.railway.app"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">URL pública do servidor Baileys que você hospedou</p>
            </div>
            <div>
              <Label htmlFor="token">Token de Autenticação (opcional)</Label>
              <Input
                id="token"
                type="password"
                placeholder="Bearer token (se seu servidor exigir)"
                value={serverToken}
                onChange={e => setServerToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Deixe em branco se o servidor não exigir autenticação</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar configuração"}
              </Button>
              <Button variant="outline" onClick={() => testConnection(serverUrl, serverToken)} disabled={testing || !serverUrl}>
                <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} /> Testar
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              <p className="font-medium text-foreground mb-1">📦 Onde hospedar o servidor?</p>
              <p>Use o código em <code className="bg-background px-1 rounded">baileys-server/</code> deste projeto. Hospede em Railway, Render, Fly.io ou VPS e cole a URL pública aqui.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminIntegration;
