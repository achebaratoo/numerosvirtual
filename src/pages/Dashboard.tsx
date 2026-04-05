import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Send, BarChart3, Bot, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ leads: 0, messages: 0, automations: 0, funnels: 0 });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [
        { count: leadCount },
        { count: msgCount },
        { count: autoCount },
        { count: funnelCount },
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("automations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
        supabase.from("funnels").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({
        leads: leadCount || 0,
        messages: msgCount || 0,
        automations: autoCount || 0,
        funnels: funnelCount || 0,
      });

      const { data: msgs } = await supabase
        .from("messages")
        .select("*, leads(name, phone)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMessages(msgs || []);
    };
    load();
  }, [user]);

  const statCards = [
    { icon: Users, label: "Total de Leads", value: stats.leads.toString(), color: "text-primary" },
    { icon: Send, label: "Mensagens Enviadas", value: stats.messages.toString(), color: "text-accent" },
    { icon: Bot, label: "Automações Ativas", value: stats.automations.toString(), color: "text-primary" },
    { icon: BarChart3, label: "Funis Ativos", value: stats.funnels.toString(), color: "text-accent" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao ZapFlow! 👋</h2>
          <p className="text-muted-foreground">Aqui está um resumo da sua atividade.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <Card key={i} className="shadow-card hover:shadow-glow transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Mensagens Recentes</h3>
            {recentMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda. Envie sua primeira mensagem!</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg: any) => (
                  <div key={msg.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className={`w-5 h-5 ${msg.direction === "outgoing" ? "text-primary" : "text-accent"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {msg.leads?.name || "Contato desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{msg.content}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
