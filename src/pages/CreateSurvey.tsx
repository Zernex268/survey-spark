import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type QuestionType = "text" | "multiple_choice" | "rating";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
}

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", type: "text", options: [] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "text",
      options: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, options: [...q.options, ""] } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
        : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Пожалуйста, введите название опроса");
      return;
    }

    if (questions.some(q => !q.text.trim())) {
      toast.error("Все вопросы должны иметь текст");
      return;
    }

    if (questions.some(q => q.type === "multiple_choice" && q.options.filter(opt => opt.trim()).length < 2)) {
      toast.error("Вопросы с выбором должны иметь минимум 2 варианта ответа");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .insert({ title, description })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert({
            survey_id: survey.id,
            question_text: question.text,
            question_type: question.type,
            order_index: i
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options for multiple choice questions
        if (question.type === "multiple_choice" && question.options.length > 0) {
          const optionsToInsert = question.options
            .filter(opt => opt.trim())
            .map((opt, idx) => ({
              question_id: questionData.id,
              option_text: opt,
              order_index: idx
            }));

          const { error: optionsError } = await supabase
            .from("question_options")
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      toast.success("Опрос успешно создан!");
      navigate(`/survey/${survey.id}`);
    } catch (error) {
      console.error("Error creating survey:", error);
      toast.error("Ошибка при создании опроса");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Link>
        </Button>

        <Card className="p-8 shadow-large bg-gradient-card border-0">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
            Создание опроса
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-semibold">Название опроса</Label>
                <Input
                  id="title"
                  placeholder="Введите название опроса"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-semibold">Описание (необязательно)</Label>
                <Textarea
                  id="description"
                  placeholder="Добавьте описание опроса"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Вопросы</h2>
                <Button type="button" onClick={addQuestion} size="sm" className="shadow-soft">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вопрос
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card key={question.id} className="p-6 space-y-4 shadow-soft">
                  <div className="flex items-start justify-between">
                    <Label className="text-lg font-semibold">Вопрос {index + 1}</Label>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Введите текст вопроса"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                    required
                  />

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
                      <SelectItem value="text">Текстовый ответ</SelectItem>
                      <SelectItem value="multiple_choice">Множественный выбор</SelectItem>
                      <SelectItem value="rating">Рейтинг (1-5)</SelectItem>
                    </SelectContent>
                  </Select>

                  {question.type === "multiple_choice" && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Варианты ответов</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Добавить вариант
                        </Button>
                      </div>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <Input
                            placeholder={`Вариант ${optIdx + 1}`}
                            value={option}
                            onChange={(e) => updateOption(question.id, optIdx, e.target.value)}
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
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 shadow-medium">
                {isSubmitting ? "Создание..." : "Создать опрос"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={isSubmitting}>
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
