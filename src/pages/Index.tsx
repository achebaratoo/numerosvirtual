import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Zap, Users, ChevronRight, Bot, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">ZapFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/pricing")}>
              Preços
            </Button>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button variant="hero" onClick={() => navigate("/register")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[128px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-[128px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Automação de WhatsApp inteligente</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: "hsl(0 0% 100%)" }}>
              Automatize seu{" "}
              <span className="text-gradient">WhatsApp</span>{" "}
              e venda mais
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: "hsl(220 10% 70%)" }}>
              Conecte seu WhatsApp, crie automações, gerencie leads e construa funis de vendas. Tudo em uma plataforma simples e poderosa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-base px-8" onClick={() => navigate("/register")}>
                Começar Grátis <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8" onClick={() => navigate("/login")}>
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Tudo que você precisa</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Ferramentas completas para automatizar seu atendimento e aumentar suas vendas
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Bot,
                title: "Automações",
                desc: "Crie fluxos automáticos de mensagens com gatilhos por palavra-chave, novo lead ou ações personalizadas.",
              },
              {
                icon: Users,
                title: "CRM de Leads",
                desc: "Gerencie todos os seus contatos em um só lugar. Organize por status, tags e acompanhe cada conversa.",
              },
              {
                icon: BarChart3,
                title: "Funis de Vendas",
                desc: "Monte funis visuais para acompanhar seus leads da captação até a conversão.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-glow transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-card-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Pronto para automatizar?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Crie sua conta gratuitamente e conecte seu WhatsApp em minutos.
          </p>
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90 font-semibold px-8"
            onClick={() => navigate("/register")}
          >
            Criar Conta Grátis <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2026 ZapFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
