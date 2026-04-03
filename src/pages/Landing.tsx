import { Button } from "@/components/ui/button";
import { Phone, Shield, Zap, Bell, ChevronRight, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">NumeroVirtual</span>
          </div>
          <div className="flex items-center gap-3">
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
              <span className="text-sm text-primary font-medium">Receba códigos de verificação instantaneamente</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: "hsl(0 0% 100%)" }}>
              Crie contas sem precisar de um{" "}
              <span className="text-gradient">número extra</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: "hsl(220 10% 70%)" }}>
              Gere números virtuais para receber códigos de verificação SMS do Google e outros serviços. Rápido, seguro e sem complicação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-base px-8" onClick={() => navigate("/register")}>
                Gerar Número Agora <ChevronRight className="w-5 h-5" />
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
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Como Funciona</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Em 3 passos simples, receba qualquer código de verificação
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Smartphone,
                title: "Gere um Número",
                desc: "Clique para gerar um número de celular virtual brasileiro pronto para uso.",
              },
              {
                icon: Bell,
                title: "Receba o Código",
                desc: "Use o número para verificação e receba o SMS com o código em tempo real.",
              },
              {
                icon: Shield,
                title: "Seguro e Privado",
                desc: "Seus dados ficam protegidos. Sem vínculo com seu número pessoal.",
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
          <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Pronto para começar?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Crie sua conta gratuitamente e gere seu primeiro número virtual agora mesmo.
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
          © 2026 NumeroVirtual. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
