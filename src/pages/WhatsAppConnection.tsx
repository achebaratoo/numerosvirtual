import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const WhatsAppConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const loadSession = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession(data);
  };

  useEffect(() => { loadSession(); }, [user]);

  const handleConnect = async () => {
    if (!user) return;
    setLoading(true);
    setShowQR(true);

    // Simulate QR code scanning delay
    setTimeout(async () => {
      const phone = `+55 11 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (session) {
        await supabase.from("whatsapp_sessions").update({
          status: "connected",
          phone_number: phone,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", session.id);
      } else {
        await supabase.from("whatsapp_sessions").insert({
          user_id: user.id,
          status: "connected",
          phone_number: phone,
          connected_at: new Date().toISOString(),
        });
      }

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "WhatsApp Conectado",
        description: `Número ${phone} conectado com sucesso`,
        type: "success",
      });

      toast({ title: "✅ WhatsApp Conectado!", description: `Número ${phone}` });
      setShowQR(false);
      setLoading(false);
      await loadSession();
    }, 3000);
  };

  const handleDisconnect = async () => {
    if (!session) return;
    await supabase.from("whatsapp_sessions").update({
      status: "disconnected",
      updated_at: new Date().toISOString(),
    }).eq("id", session.id);
    toast({ title: "WhatsApp desconectado" });
    await loadSession();
  };

  const isConnected = session?.status === "connected";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Conexão WhatsApp</h2>
          <p className="text-muted-foreground mt-1">Conecte seu WhatsApp para começar a enviar mensagens</p>
        </div>

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

            {showQR && !isConnected && (
              <div className="py-6">
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center bg-secondary/50">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-primary mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Escaneando QR Code...</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {isConnected ? (
                <Button variant="destructive" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              ) : (
                <Button variant="hero" size="lg" onClick={handleConnect} disabled={loading}>
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
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
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppConnection;
