import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Bell, CheckCircle, Clock } from "lucide-react";

const stats = [
  { icon: Smartphone, label: "Números Gerados", value: "12", color: "text-primary" },
  { icon: Bell, label: "SMS Recebidos", value: "8", color: "text-accent" },
  { icon: CheckCircle, label: "Verificações", value: "6", color: "text-accent" },
  { icon: Clock, label: "Pendentes", value: "2", color: "text-muted-foreground" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta! 👋</h2>
          <p className="text-muted-foreground">Aqui está um resumo da sua atividade.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
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
            <div className="space-y-3">
              {[
                { num: "(11) 98765-4321", status: "Código recebido", time: "2 min atrás", ok: true },
                { num: "(21) 91234-5678", status: "Aguardando SMS", time: "5 min atrás", ok: false },
                { num: "(31) 99876-5432", status: "Código recebido", time: "15 min atrás", ok: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.num}</p>
                      <p className={`text-xs ${item.ok ? "text-accent" : "text-muted-foreground"}`}>{item.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
