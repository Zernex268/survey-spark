import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  question_options: { id: string; option_text: string; order_index: number }[];
}

const TakeSurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchSurveyData();
  }, [id]);

  const fetchSurveyData = async () => {
    if (!id) return;

    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          *,
          question_options(*)
        `)
        .eq("survey_id", id)
        .order("order_index");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast.error("Ошибка загрузки опроса");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all questions are answered
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error("Пожалуйста, ответьте на все вопросы");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create response
      const { data: response, error: responseError } = await supabase
        .from("responses")
        .insert({ survey_id: id })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create answers
      const answersToInsert = Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        
        if (question?.question_type === "multiple_choice") {
          return {
            response_id: response.id,
            question_id: questionId,
            selected_option_id: answer,
            answer_text: null
          };
        } else {
          return {
            response_id: response.id,
            question_id: questionId,
            answer_text: String(answer),
            selected_option_id: null
          };
        }
      });

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answersToInsert);

      if (answersError) throw answersError;

      setIsSubmitted(true);
      toast.success("Спасибо за ваши ответы!");
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Ошибка отправки ответов");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-xl text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-12 text-center shadow-large">
          <h2 className="text-2xl font-bold mb-4">Опрос не найден</h2>
          <Button asChild>
            <Link to="/surveys">Вернуться к списку</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-12 text-center shadow-large max-w-md">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Спасибо!</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Ваши ответы успешно сохранены
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="shadow-medium">
              <Link to="/surveys">Другие опросы</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/results/${survey.id}`}>Посмотреть результаты</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/surveys">
            <ArrowLeft className="w-4 h-4 mr-2" />
            К списку опросов
          </Link>
        </Button>

        <Card className="p-8 md:p-12 shadow-large bg-gradient-card border-0">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-muted-foreground text-lg">{survey.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-6 space-y-4 shadow-soft">
                <Label className="text-lg font-semibold">
                  {index + 1}. {question.question_text}
                </Label>

                {question.question_type === "text" && (
                  <Textarea
                    placeholder="Введите ваш ответ"
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                )}

                {question.question_type === "multiple_choice" && (
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    required
                  >
                    {question.question_options
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((option) => (
                        <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer font-normal">
                            {option.option_text}
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                )}

                {question.question_type === "rating" && (
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="flex gap-3"
                    required
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex flex-col items-center gap-2">
                        <RadioGroupItem value={String(rating)} id={`${question.id}-${rating}`} />
                        <Label htmlFor={`${question.id}-${rating}`} className="cursor-pointer font-semibold text-lg">
                          {rating}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </Card>
            ))}

            <Button type="submit" disabled={isSubmitting} className="w-full text-lg py-6 shadow-medium">
              {isSubmitting ? "Отправка..." : "Отправить ответы"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default TakeSurvey;
