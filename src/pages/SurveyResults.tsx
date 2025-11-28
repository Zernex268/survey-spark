import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
}

interface QuestionOption {
  id: string;
  option_text: string;
}

interface Answer {
  answer_text: string | null;
  selected_option_id: string | null;
  question_id: string;
}

const SurveyResults = () => {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [options, setOptions] = useState<Record<string, QuestionOption[]>>({});
  const [responsesCount, setResponsesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
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
        .select("*")
        .eq("survey_id", id)
        .order("order_index");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      const { data: responsesData, error: responsesError } = await supabase
        .from("responses")
        .select("id")
        .eq("survey_id", id);

      if (responsesError) throw responsesError;
      setResponsesCount(responsesData?.length || 0);

      const { data: answersData, error: answersError } = await supabase
        .from("answers")
        .select(`
          answer_text,
          selected_option_id,
          question_id
        `)
        .in("response_id", responsesData?.map(r => r.id) || []);

      if (answersError) throw answersError;
      setAnswers(answersData || []);

      // Fetch options for multiple choice questions
      const mcQuestions = questionsData?.filter(q => q.question_type === "multiple_choice") || [];
      if (mcQuestions.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from("question_options")
          .select("*")
          .in("question_id", mcQuestions.map(q => q.id));

        if (optionsError) throw optionsError;

        const optionsByQuestion: Record<string, QuestionOption[]> = {};
        optionsData?.forEach(option => {
          if (!optionsByQuestion[option.question_id]) {
            optionsByQuestion[option.question_id] = [];
          }
          optionsByQuestion[option.question_id].push(option);
        });
        setOptions(optionsByQuestion);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionResults = (question: Question) => {
    const questionAnswers = answers.filter(a => a.question_id === question.id);

    if (question.question_type === "text") {
      return (
        <div className="space-y-3">
          {questionAnswers.length === 0 ? (
            <p className="text-muted-foreground italic">Ответов пока нет</p>
          ) : (
            questionAnswers.map((answer, idx) => (
              <Card key={idx} className="p-4 bg-secondary/30">
                <p className="text-foreground">{answer.answer_text}</p>
              </Card>
            ))
          )}
        </div>
      );
    }

    if (question.question_type === "multiple_choice") {
      const questionOptions = options[question.id] || [];
      const optionCounts: Record<string, number> = {};
      
      questionOptions.forEach(opt => {
        optionCounts[opt.id] = 0;
      });

      questionAnswers.forEach(answer => {
        if (answer.selected_option_id) {
          optionCounts[answer.selected_option_id] = (optionCounts[answer.selected_option_id] || 0) + 1;
        }
      });

      const total = questionAnswers.length;

      return (
        <div className="space-y-4">
          {questionOptions.map(option => {
            const count = optionCounts[option.id] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.option_text}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>
            );
          })}
        </div>
      );
    }

    if (question.question_type === "rating") {
      const ratings: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      
      questionAnswers.forEach(answer => {
        if (answer.answer_text) {
          ratings[answer.answer_text] = (ratings[answer.answer_text] || 0) + 1;
        }
      });

      const total = questionAnswers.length;
      const average = total > 0 
        ? Object.entries(ratings).reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0) / total
        : 0;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold text-primary">{average.toFixed(1)}</span>
            <span className="text-muted-foreground">средний рейтинг</span>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratings[String(rating)] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-4">
                  <span className="font-semibold w-8">{rating} ★</span>
                  <Progress value={percentage} className="flex-1 h-3" />
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
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

  return (
    <div className="min-h-screen bg-gradient-hero py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/surveys">
            <ArrowLeft className="w-4 h-4 mr-2" />
            К списку опросов
          </Link>
        </Button>

        <Card className="p-8 md:p-12 shadow-large bg-gradient-card border-0 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                {survey.title}
              </h1>
              {survey.description && (
                <p className="text-muted-foreground text-lg">{survey.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-8 p-4 bg-secondary/30 rounded-lg">
            <Users className="w-5 h-5" />
            <span className="font-semibold">
              Всего ответов: {responsesCount}
            </span>
          </div>

          {responsesCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-6">
                Пока нет ответов на этот опрос
              </p>
              <Button asChild className="shadow-medium">
                <Link to={`/survey/${survey.id}`}>Пройти опрос</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((question, index) => (
                <Card key={question.id} className="p-6 space-y-4 shadow-soft">
                  <h3 className="text-xl font-semibold">
                    {index + 1}. {question.question_text}
                  </h3>
                  {getQuestionResults(question)}
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SurveyResults;
