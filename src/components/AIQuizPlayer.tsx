import { useState } from 'react';
import { 
  CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AIQuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: number;
  correctText?: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AIQuizPlayerProps {
  questions: AIQuizQuestion[];
  title: string;
  passingScore?: number;
  onComplete: (score: number, passed: boolean, answers: (number | string)[]) => void;
  onClose: () => void;
}

export const AIQuizPlayer = ({
  questions,
  title,
  passingScore = 60,
  onComplete,
  onClose,
}: AIQuizPlayerProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  
  const isCorrect = question.type === 'short_answer'
    ? textAnswer.trim().toLowerCase().includes((question.correctText || '').toLowerCase())
    : selectedAnswer === question.correctAnswer;

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (question.type === 'short_answer') {
      if (!textAnswer.trim()) return;
    } else if (selectedAnswer === null) return;
    setIsAnswered(true);
  };

  const handleNext = () => {
    const answer = question.type === 'short_answer' ? textAnswer : selectedAnswer!;
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      const correctCount = newAnswers.reduce((count, ans, index) => {
        const q = questions[index];
        if (q.type === 'short_answer') {
          return count + (String(ans).trim().toLowerCase().includes((q.correctText || '').toLowerCase()) ? 1 : 0);
        }
        return count + (ans === q.correctAnswer ? 1 : 0);
      }, 0);
      const score = Math.round((correctCount / questions.length) * 100);
      onComplete(score, score >= passingScore, newAnswers);
      setShowResult(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setTextAnswer('');
      setIsAnswered(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTextAnswer('');
    setAnswers([]);
    setShowResult(false);
    setIsAnswered(false);
  };

  const finalScore = showResult
    ? Math.round((answers.filter((a, i) => {
        const q = questions[i];
        if (q.type === 'short_answer') return String(a).trim().toLowerCase().includes((q.correctText || '').toLowerCase());
        return a === q.correctAnswer;
      }).length / questions.length) * 100)
    : 0;
  const passed = finalScore >= passingScore;

  if (showResult) {
    return (
      <Card className="max-w-lg mx-auto animate-fade-in">
        <CardContent className="pt-8 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            passed ? "bg-success/10" : "bg-destructive/10"
          )}>
            {passed ? <Trophy className="h-10 w-10 text-success" /> : <BookOpen className="h-10 w-10 text-destructive" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{passed ? 'Excellent!' : 'Keep Practicing!'}</h2>
          <p className="text-muted-foreground mb-6">
            {passed ? 'You mastered this topic!' : 'Review the video and try again.'}
          </p>
          <div className="bg-muted rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-primary mb-2">{finalScore}%</div>
            <p className="text-sm text-muted-foreground">
              {answers.filter((a, i) => {
                const q = questions[i];
                if (q.type === 'short_answer') return String(a).trim().toLowerCase().includes((q.correctText || '').toLowerCase());
                return a === q.correctAnswer;
              }).length} of {questions.length} correct
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="text-xs text-muted-foreground">AI-Generated Quiz</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Back to Video</Button>
            {!passed && (
              <Button onClick={handleRetry} className="gap-2">
                <RotateCcw className="h-4 w-4" />Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const difficultyColor = question.difficulty === 'hard' ? 'text-destructive' : question.difficulty === 'medium' ? 'text-warning' : 'text-success';

  return (
    <Card className="max-w-lg mx-auto animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium capitalize", difficultyColor)}>{question.difficulty}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
              {question.type.replace('_', '/')}
            </span>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
      </CardHeader>

      <CardContent>
        <CardTitle className="text-lg mb-6">{question.question}</CardTitle>

        {question.type === 'short_answer' ? (
          <div className="space-y-3">
            <Input
              placeholder="Type your answer..."
              value={textAnswer}
              onChange={(e) => !isAnswered && setTextAnswer(e.target.value)}
              disabled={isAnswered}
              className="text-base"
            />
            {isAnswered && (
              <div className={cn("p-3 rounded-lg text-sm", isCorrect ? "bg-success/10" : "bg-destructive/10")}>
                <p className="font-medium">{isCorrect ? '✓ Correct!' : '✗ Not quite'}</p>
                <p className="text-muted-foreground mt-1">Answer: {question.correctText}</p>
                <p className="text-muted-foreground mt-1">{question.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              
              let optionClass = "border-2 border-muted hover:border-primary/50";
              if (isAnswered) {
                if (isCorrectAnswer) optionClass = "border-2 border-success bg-success/10";
                else if (isSelected && !isCorrectAnswer) optionClass = "border-2 border-destructive bg-destructive/10";
              } else if (isSelected) {
                optionClass = "border-2 border-primary bg-primary/5";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isAnswered}
                  className={cn("w-full p-4 rounded-lg text-left transition-all touch-target", optionClass)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {isAnswered && isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-success" />}
                    {isAnswered && isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-destructive" />}
                  </div>
                </button>
              );
            })}

            {isAnswered && (
              <div className={cn("mt-4 p-4 rounded-lg animate-fade-in", isCorrect ? "bg-success/10" : "bg-warning/10")}>
                <p className="text-sm font-medium mb-1">{isCorrect ? '✓ Correct!' : '✗ Not quite right'}</p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-6">
          {!isAnswered ? (
            <Button onClick={handleConfirm} disabled={question.type === 'short_answer' ? !textAnswer.trim() : selectedAnswer === null}>
              Confirm Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {isLastQuestion ? 'See Results' : 'Next Question'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
