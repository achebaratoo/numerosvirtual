import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Ideal para testar a plataforma",
    features: [
      "1 conexão WhatsApp",
      "100 mensagens/mês",
      "50 leads",
      "2 automações",
      "1 funil de vendas",
    ],
    cta: "Começar Grátis",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    description: "Para profissionais e pequenos negócios",
    features: [
      "3 conexões WhatsApp",
      "Mensagens ilimitadas",
      "Leads ilimitados",
      "Automações ilimitadas",
      "Funis ilimitados",
      "Suporte prioritário",
      "Variáveis personalizadas",
    ],
    cta: "Assinar Pro",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "R$ 297",
    period: "/mês",
    description: "Para equipes e agências",
    features: [
      "Tudo do Pro",
      "Conexões ilimitadas",
      "API completa",
      "Webhooks",
      "Multi-usuários",
      "Gerente de conta",
      "SLA garantido",
    ],
    cta: "Falar com Vendas",
    variant: "outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">ZapFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Entrar</Button>
            <Button variant="hero" onClick={() => navigate("/register")}>Começar Grátis</Button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Planos e Preços</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Escolha o plano ideal para escalar suas vendas pelo WhatsApp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative shadow-card hover:shadow-glow transition-all duration-300 ${
                  plan.popular ? "border-primary ring-2 ring-primary/20 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant} className="w-full" onClick={() => navigate("/register")}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2026 ZapFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
