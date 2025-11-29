import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type QuestionType = "text" | "multiple_choice" | "rating";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  allowMultiple: boolean;
}

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Необходимо войти в систему");
        navigate("/auth");
      }
    });
  }, [navigate]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(),
      text: "",
      type: "text",
      options: [],
      allowMultiple: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Пожалуйста, введите название опроса");
      return;
    }

    if (questions.length === 0) {
      toast.error("Добавьте хотя бы один вопрос");
      return;
    }

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Необходимо войти в систему");
        navigate("/auth");
        return;
      }

      // Insert survey
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .insert({ 
          title, 
          description,
          user_id: session.user.id 
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const { data: insertedQuestion, error: questionError } = await supabase
          .from("questions")
          .insert({
            survey_id: survey.id,
            question_text: question.text,
            question_type: question.type,
            order_index: i,
            allow_multiple_answers: question.allowMultiple,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Insert options for multiple choice questions
        if (question.type === "multiple_choice" && question.options.length > 0) {
          const optionsData = question.options
            .filter((opt) => opt.trim())
            .map((opt, idx) => ({
              question_id: insertedQuestion.id,
              option_text: opt,
              order_index: idx,
            }));

          const { error: optionsError } = await supabase
            .from("question_options")
            .insert(optionsData);

          if (optionsError) throw optionsError;
        }
      }

      toast.success("Опрос создан успешно!");
      navigate(`/survey/${survey.id}`);
    } catch (error) {
      console.error("Error creating survey:", error);
      toast.error("Ошибка при создании опроса");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-survey-gradient-start via-survey-gradient-middle to-survey-gradient-end py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Link>
        </Button>

        <Card className="p-8 md:p-12 shadow-survey-card bg-white/95 backdrop-blur-sm">
          <h1 className="text-4xl font-display font-bold mb-8 text-survey-primary">
            Создать опрос
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название опроса"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите ваш опрос (необязательно)"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-semibold text-survey-primary">
                  Вопросы
                </h2>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вопрос
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card key={question.id} className="p-6 space-y-4 bg-survey-card-bg">
                  <div className="flex items-start justify-between">
                    <Label className="text-lg font-semibold">
                      Вопрос {index + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(question.id, "text", e.target.value)
                    }
                    placeholder="Текст вопроса"
                    required
                  />

                  <div className="space-y-2">
                    <Label>Тип вопроса</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: QuestionType) => {
                        updateQuestion(question.id, "type", value);
                        if (value === "multiple_choice" && question.options.length === 0) {
                          updateQuestion(question.id, "options", ["", ""]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Текст</SelectItem>
                        <SelectItem value="multiple_choice">Множественный выбор</SelectItem>
                        <SelectItem value="rating">Рейтинг (1-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {question.type === "multiple_choice" && (
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                        id={`allow-multiple-${question.id}`}
                        checked={question.allowMultiple}
                        onCheckedChange={(checked) => {
                          updateQuestion(question.id, "allowMultiple", checked as boolean);
                        }}
                      />
                      <Label htmlFor={`allow-multiple-${question.id}`} className="text-sm cursor-pointer">
                        Разрешить множественный выбор
                      </Label>
                    </div>
                  )}

                  {question.type === "multiple_choice" && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Варианты ответов</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Добавить
                        </Button>
                      </div>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(question.id, optIdx, e.target.value)
                            }
                            placeholder={`Вариант ${optIdx + 1}`}
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(question.id, optIdx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 text-survey-secondary">
                  <p>Нет вопросов. Нажмите "Добавить вопрос" чтобы начать.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Создать опрос
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateSurvey;
