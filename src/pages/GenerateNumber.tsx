import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Copy, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedNumber {
  number: string;
  ddd: string;
  createdAt: string;
  status: "active" | "expired";
  code?: string;
}

const ddds = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92"];

const generatePhone = (): GeneratedNumber => {
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  const n1 = Math.floor(Math.random() * 9000 + 1000);
  const n2 = Math.floor(Math.random() * 9000 + 1000);
  return {
    number: `(${ddd}) 9${n1}-${n2}`,
    ddd,
    createdAt: new Date().toLocaleTimeString("pt-BR"),
    status: "active",
  };
};

const GenerateNumber = () => {
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<GeneratedNumber[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const newNum = generatePhone();
      setNumbers((prev) => [newNum, ...prev]);
      setLoading(false);
      toast({ title: "Número gerado!", description: newNum.number });
    }, 800);
  };

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number.replace(/\D/g, ""));
    toast({ title: "Copiado!", description: "Número copiado para a área de transferência." });
  };

  const simulateCode = (index: number) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setNumbers((prev) =>
      prev.map((n, i) => (i === index ? { ...n, code } : n))
    );
    toast({ title: "📩 SMS Recebido!", description: `Código de verificação: ${code}` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gerador de Número Virtual</h2>
          <p className="text-muted-foreground mt-1">
            Gere um número para receber códigos de verificação SMS
          </p>
        </div>

        <Card className="shadow-glow border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <Button
              variant="hero"
              size="lg"
              className="px-8"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>Gerar Novo Número</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              O número ficará ativo por 10 minutos
            </p>
          </CardContent>
        </Card>

        {numbers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Números Gerados</h3>
            {numbers.map((num, i) => (
              <Card key={i} className="shadow-card animate-fade-in">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-semibold text-foreground">{num.number}</p>
                        <p className="text-xs text-muted-foreground">Gerado às {num.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={num.status === "active" ? "default" : "secondary"}>
                        {num.status === "active" ? "Ativo" : "Expirado"}
                      </Badge>
                      <Button variant="outline" size="icon" onClick={() => handleCopy(num.number)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {num.code ? (
                    <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">
                        Código recebido: <span className="font-mono font-bold text-accent">{num.code}</span>
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => simulateCode(i)}
                    >
                      Simular recebimento de SMS
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GenerateNumber;
