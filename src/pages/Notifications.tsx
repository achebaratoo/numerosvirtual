import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";

const notifications = [
  { icon: CheckCircle, title: "Código recebido", desc: "SMS com código 482910 recebido no número (11) 98765-4321", time: "2 min atrás", type: "success" },
  { icon: AlertCircle, title: "Número expirado", desc: "O número (21) 91234-5678 expirou após 10 minutos", time: "15 min atrás", type: "warning" },
  { icon: CheckCircle, title: "Código recebido", desc: "SMS com código 173920 recebido no número (31) 99876-5432", time: "30 min atrás", type: "success" },
  { icon: Info, title: "Dica", desc: "Você pode gerar até 5 números por hora no plano gratuito", time: "1h atrás", type: "info" },
  { icon: CheckCircle, title: "Conta criada", desc: "Bem-vindo ao NumeroVirtual! Comece gerando seu primeiro número.", time: "2h atrás", type: "success" },
];

const typeColors: Record<string, string> = {
  success: "text-accent",
  warning: "text-destructive",
  info: "text-primary",
};

const Notifications = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
        </div>
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <Card key={i} className="shadow-card hover:shadow-glow transition-shadow animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <div className={`mt-0.5 ${typeColors[n.type]}`}>
                    <n.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
