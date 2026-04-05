import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: msgs }, { data: lds }] = await Promise.all([
      supabase.from("messages").select("*, leads(name, phone)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("leads").select("id, name, phone").eq("user_id", user.id).order("name"),
    ]);
    setMessages(msgs || []);
    setLeads(lds || []);
  };

  useEffect(() => { load(); }, [user]);

  const handleSend = async () => {
    if (!user || !content.trim()) return;
    setSending(true);

    let finalContent = content;
    if (selectedLead) {
      const lead = leads.find(l => l.id === selectedLead);
      if (lead) {
        finalContent = content.replace(/\{nome\}/g, lead.name).replace(/\{telefone\}/g, lead.phone);
      }
    }

    const { error } = await supabase.from("messages").insert({
      user_id: user.id,
      lead_id: selectedLead || null,
      content: finalContent,
      direction: "outgoing",
      status: "sent",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mensagem enviada!" });
      setContent("");

      // Simulate response after 2s
      if (selectedLead) {
        setTimeout(async () => {
          await supabase.from("messages").insert({
            user_id: user!.id,
            lead_id: selectedLead,
            content: "Olá! Recebi sua mensagem. 👋",
            direction: "incoming",
            status: "received",
          });
          await load();
        }, 2000);
      }
    }
    await load();
    setSending(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mensagens</h2>
          <p className="text-muted-foreground">Envie mensagens para seus leads</p>
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Destinatário</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger><SelectValue placeholder="Selecione um lead (opcional)" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name} - {l.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Digite sua mensagem... Use {nome} e {telefone} como variáveis"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variáveis disponíveis: <code className="text-primary">{"{nome}"}</code> <code className="text-primary">{"{telefone}"}</code>
              </p>
            </div>
            <Button variant="hero" onClick={handleSend} disabled={!content.trim() || sending}>
              <Send className="w-4 h-4 mr-2" /> {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Histórico</h3>
          {messages.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => (
                <Card key={msg.id} className="shadow-card">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${msg.direction === "outgoing" ? "text-primary" : "text-accent"}`}>
                        {msg.direction === "outgoing" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {msg.leads?.name || "Sem destinatário"}
                          </span>
                          <Badge variant={msg.direction === "outgoing" ? "default" : "secondary"} className="text-xs">
                            {msg.direction === "outgoing" ? "Enviada" : "Recebida"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
