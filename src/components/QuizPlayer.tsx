import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Trophy,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quiz, QuizQuestion } from '@/types/content';
import { cn } from '@/lib/utils';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean, answers: number[]) => void;
  onClose: () => void;
  bestScore?: number;
}

export const QuizPlayer = ({
  quiz,
  onComplete,
  onClose,
  bestScore,
}: QuizPlayerProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setIsAnswered(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer!];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Calculate score
      const correctCount = newAnswers.reduce((count, answer, index) => {
        return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
      }, 0);
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = score >= quiz.passingScore;
      
      onComplete(score, passed, newAnswers);
      setShowResult(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setIsAnswered(false);
  };

  // Calculate final score for result screen
  const finalScore = showResult 
    ? Math.round((answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length / quiz.questions.length) * 100)
    : 0;
  const passed = finalScore >= quiz.passingScore;

  if (showResult) {
    return (
      <Card className="max-w-lg mx-auto animate-fade-in">
        <CardContent className="pt-8 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            passed ? "bg-success/10" : "bg-destructive/10"
          )}>
            {passed ? (
              <Trophy className="h-10 w-10 text-success" />
            ) : (
              <BookOpen className="h-10 w-10 text-destructive" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {passed 
              ? 'You passed the quiz successfully!' 
              : 'Review the content and try again.'}
          </p>

          <div className="bg-muted rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {finalScore}%
            </div>
            <p className="text-sm text-muted-foreground">
              {answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length} of {quiz.questions.length} correct
            </p>
            {bestScore !== undefined && bestScore > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Best score: {bestScore}%
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              Back to Content
            </Button>
            {!passed && (
              <Button onClick={handleRetry} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {quiz.title}
          </span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent>
        <CardTitle className="text-lg mb-6">
          {question.question}
        </CardTitle>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            
            let optionClass = "border-2 border-muted hover:border-primary/50";
            if (isAnswered) {
              if (isCorrectAnswer) {
                optionClass = "border-2 border-success bg-success/10";
              } else if (isSelected && !isCorrectAnswer) {
                optionClass = "border-2 border-destructive bg-destructive/10";
              }
            } else if (isSelected) {
              optionClass = "border-2 border-primary bg-primary/5";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-4 rounded-lg text-left transition-all touch-target",
                  optionClass
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  {isAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className={cn(
            "mt-4 p-4 rounded-lg animate-fade-in",
            isCorrect ? "bg-success/10" : "bg-warning/10"
          )}>
            <p className="text-sm font-medium mb-1">
              {isCorrect ? '✓ Correct!' : '✗ Not quite right'}
            </p>
            <p className="text-sm text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end mt-6">
          {!isAnswered ? (
            <Button 
              onClick={handleConfirm}
              disabled={selectedAnswer === null}
            >
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
