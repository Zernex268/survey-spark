import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ClipboardList, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User } from "@supabase/supabase-js";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string | null;
}

const MySurveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт, чтобы просмотреть свои опросы",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setUser(user);
    fetchMySurveys(user.id);
  };

  const fetchMySurveys = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить опросы",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", surveyId);

      if (error) throw error;

      toast({
        title: "Опрос удален",
        description: "Опрос успешно удален",
      });

      setSurveys(surveys.filter((s) => s.id !== surveyId));
    } catch (error) {
      console.error("Error deleting survey:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить опрос",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Мои опросы
          </h1>
          <p className="text-muted-foreground text-lg">
            Управляйте своими опросами: просматривайте, редактируйте и удаляйте
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <Card className="p-12 text-center shadow-soft">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">У вас пока нет опросов</h2>
            <p className="text-muted-foreground mb-6">
              Создайте свой первый опрос, чтобы начать собирать ответы
            </p>
            <Button asChild className="shadow-medium">
              <Link to="/create">Создать опрос</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className="p-6 space-y-4 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-0"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-2">{survey.title}</h3>
                  {survey.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {survey.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(survey.created_at), "d MMMM yyyy", { locale: ru })}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button asChild className="flex-1 shadow-soft">
                    <Link to={`/survey/${survey.id}`}>Пройти опрос</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/results/${survey.id}`}>Результаты</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить опрос?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя отменить. Опрос и все его ответы будут удалены навсегда.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(survey.id)}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySurveys;
