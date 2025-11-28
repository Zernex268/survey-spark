import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ClipboardList, BarChart3, Users, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">Создавайте опросы за минуты</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Онлайн Опросы
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Создавайте, распространяйте и анализируйте опросы с помощью современной и удобной платформы
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <Button asChild size="lg" className="text-lg px-8 shadow-medium hover:shadow-large transition-all">
              <Link to="/create">Создать опрос</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/surveys">Просмотреть опросы</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 space-y-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Легко создавать</h3>
            <p className="text-muted-foreground leading-relaxed">
              Интуитивный интерфейс для создания опросов любой сложности. Добавляйте текстовые вопросы, варианты выбора и рейтинги.
            </p>
          </Card>

          <Card className="p-8 space-y-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold">Удобно проходить</h3>
            <p className="text-muted-foreground leading-relaxed">
              Респонденты могут легко проходить опросы с любого устройства. Современный дизайн делает процесс приятным.
            </p>
          </Card>

          <Card className="p-8 space-y-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Анализ результатов</h3>
            <p className="text-muted-foreground leading-relaxed">
              Просматривайте результаты в реальном времени. Получайте ценную информацию от ваших респондентов.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 bg-gradient-primary border-0 shadow-large text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Создайте свой первый опрос прямо сейчас
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 shadow-medium">
            <Link to="/create">Создать первый опрос</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Index;
