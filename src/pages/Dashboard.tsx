import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Bell, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ numbers: 0, sms: 0, verified: 0, pending: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: nums } = await supabase
        .from("generated_numbers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const all = nums || [];
      setRecent(all.slice(0, 3));
      setStats({
        numbers: all.length,
        sms: all.filter((n: any) => n.code).length,
        verified: all.filter((n: any) => n.code).length,
        pending: all.filter((n: any) => !n.code && n.status === "active").length,
      });

      // get total counts
      const { count: totalNums } = await supabase.from("generated_numbers").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: totalSms } = await supabase.from("generated_numbers").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("code", "is", null);
      const { count: totalPending } = await supabase.from("generated_numbers").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("code", null).eq("status", "active");
      setStats({
        numbers: totalNums || 0,
        sms: totalSms || 0,
        verified: totalSms || 0,
        pending: totalPending || 0,
      });
    };
    load();
  }, [user]);

  const statCards = [
    { icon: Smartphone, label: "Números Gerados", value: stats.numbers.toString(), color: "text-primary" },
    { icon: Bell, label: "SMS Recebidos", value: stats.sms.toString(), color: "text-accent" },
    { icon: CheckCircle, label: "Verificações", value: stats.verified.toString(), color: "text-accent" },
    { icon: Clock, label: "Pendentes", value: stats.pending.toString(), color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta! 👋</h2>
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
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma atividade ainda. Gere seu primeiro número!</p>
            ) : (
              <div className="space-y-3">
                {recent.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.phone_number}</p>
                        <p className={`text-xs ${item.code ? "text-accent" : "text-muted-foreground"}`}>
                          {item.code ? "Código recebido" : "Aguardando SMS"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleTimeString("pt-BR")}
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
