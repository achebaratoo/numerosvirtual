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

const normalizeServerUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const AdminIntegration = () => {
  const { toast } = useToast();
  const [serverUrl, setServerUrl] = useState("");
  const [serverToken, setServerToken] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [status, setStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const [serverInfo, setServerInfo] = useState<any>(null);
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
    setServerInfo(null);
    try {
      const cleanUrl = normalizeServerUrl(url);
      const res = await fetch(`${cleanUrl}/`, {
        headers: token ? { "apikey": token } : {},
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        setServerInfo(json);
        setStatus("online");
      } else {
        setStatus("offline");
      }
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
      toast({ title: "URL obrigatória", description: "Informe a URL da Evolution API", variant: "destructive" });
      return;
    }
    setSaving(true);
    const normalizedUrl = normalizeServerUrl(serverUrl);
    // upsert: try update first, if no row exists, insert
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", "whatsapp_server")
      .maybeSingle();

    const payload = {
      key: "whatsapp_server",
      value: { url: normalizedUrl, token: serverToken.trim(), provider: "evolution" },
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("system_settings").update(payload).eq("key", "whatsapp_server")
      : await supabase.from("system_settings").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Servidor configurado", description: "Os usuários já podem escanear o QR Code" });
    setServerUrl(normalizedUrl);
    setSavedUrl(normalizedUrl);
    setSavedToken(serverToken.trim());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integração de Servidor (Evolution API)</h2>
          <p className="text-muted-foreground">Configure a Evolution API global usada por todos os usuários</p>
        </div>

        {/* Flow guide */}
        <Card className="shadow-card border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Como funciona o fluxo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-3"><span className="font-bold text-primary">1.</span><p><strong>Você (admin)</strong> hospeda a Evolution API (Docker no Railway, VPS, Render…) e cola a URL e a API Key aqui.</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">2.</span><p>O sistema testa a conexão chamando <code className="bg-background px-1 rounded">GET /</code> — se ficar verde está OK.</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">3.</span><p><strong>Os usuários</strong> entram em "WhatsApp" e o sistema cria uma instância única para cada um (instanceName = user_id).</p></div>
            <div className="flex gap-3"><span className="font-bold text-primary">4.</span><p>Cada usuário escaneia o QR Code com o WhatsApp dele e fica conectado em sessão isolada.</p></div>
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
                placeholder="https://sua-evolution.up.railway.app"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">URL pública da sua Evolution API (sem barra no final)</p>
            </div>
            <div>
              <Label htmlFor="token">API Key (header <code>apikey</code>)</Label>
              <Input
                id="token"
                type="password"
                placeholder="Sua AUTHENTICATION_API_KEY global"
                value={serverToken}
                onChange={e => setServerToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Definida na variável <code>AUTHENTICATION_API_KEY</code> da Evolution API</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar configuração"}
              </Button>
              <Button variant="outline" onClick={() => testConnection(serverUrl, serverToken)} disabled={testing || !serverUrl}>
                <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} /> Testar
              </Button>
            </div>

            {serverInfo && (
              <div className="text-xs bg-secondary/50 p-3 rounded-lg space-y-1">
                <p className="font-medium text-foreground">✅ Resposta do servidor:</p>
                <p>Versão: <code>{serverInfo.version || "?"}</code></p>
                {serverInfo.message && <p>{serverInfo.message}</p>}
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg space-y-2">
              <p className="font-medium text-foreground">📦 Como hospedar Evolution API rapidinho</p>
              <p>1. Crie um projeto no <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-primary underline">Railway</a> com a imagem Docker <code>atendai/evolution-api:latest</code></p>
              <p>2. Defina a variável <code>AUTHENTICATION_API_KEY</code> com um token forte</p>
              <p>3. Gere o domínio público e cole a URL acima junto com a API Key</p>
              <p>📚 Docs: <a href="https://doc.evolution-api.com" target="_blank" rel="noreferrer" className="text-primary underline">doc.evolution-api.com</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminIntegration;
