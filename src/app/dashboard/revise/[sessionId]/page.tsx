"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Question {
  id: string;
  questionText: string;
  answerExcerpt: string | null;
  previouslyMissed: boolean;
}

interface SessionData {
  id: string;
  pageTitle: string | null;
  status: string;
  questionsTotal: number;
  questionsAnswered: number;
  correctCount: number;
  questions: Question[];
}

type RevisionState = "loading" | "question" | "answer" | "complete" | "error";

export default function RevisionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [state, setState] = useState<RevisionState>("loading");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/revisions/${sessionId}`);
      if (!res.ok) throw new Error("Session introuvable");
      const data: SessionData = await res.json();
      setSessionData(data);
      setAnswered(data.questionsAnswered);
      setCorrect(data.correctCount);

      if (data.status === "completed") {
        setState("complete");
      } else {
        // Resume from where user left off
        setCurrentIndex(data.questionsAnswered);
        setState("question");
      }
    } catch {
      setError("Impossible de charger la session");
      setState("error");
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const submitAnswer = async (isCorrect: boolean) => {
    if (!sessionData) return;
    const question = sessionData.questions[currentIndex];
    if (!question) return;

    setFeedback(isCorrect ? "correct" : "incorrect");

    try {
      const res = await fetch(`/api/revisions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, isCorrect }),
      });

      // Already answered (e.g. double click): resync with the server's state.
      if (res.status === 409) {
        setFeedback(null);
        await fetchSession();
        return;
      }
      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      const result = await res.json();
      setAnswered(result.questionsAnswered);
      setCorrect(result.correctCount);

      // Brief feedback display
      setTimeout(() => {
        setFeedback(null);
        if (result.isComplete) {
          setState("complete");
        } else {
          setCurrentIndex((i) => i + 1);
          setState("question");
        }
      }, 800);
    } catch {
      setFeedback(null);
      setError("Erreur lors de l'envoi de la réponse");
    }
  };

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Chargement de la session…</p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-sm text-streak">{error}</p>
        <button onClick={() => router.push("/dashboard/pages")} className="btn-secondary">
          Retour aux pages
        </button>
      </main>
    );
  }

  if (state === "complete") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-6 text-center">
          <h1 className="text-xl font-semibold text-text-primary">🎉 Session terminée !</h1>
          <p className="text-sm text-text-secondary">{sessionData?.pageTitle}</p>

          <div className="card-default space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Questions</span>
              <span className="font-medium text-text-primary">{sessionData?.questionsTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Correctes</span>
              <span className="font-medium text-success">{correct}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">À revoir</span>
              <span className="font-medium text-warning">
                {(sessionData?.questionsTotal ?? 0) - correct}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-lg font-semibold text-text-primary">
                {sessionData?.questionsTotal
                  ? Math.round((correct / sessionData.questionsTotal) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/dashboard/pages")} className="btn-primary w-full">
              Réviser une autre page
            </button>
            <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full">
              Tableau de bord
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Question / Answer display
  const currentQuestion = sessionData?.questions[currentIndex];
  const total = sessionData?.questionsTotal ?? 0;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/pages")}
            className="text-sm text-text-secondary hover:text-text-primary"
            aria-label="Quitter"
          >
            ✕
          </button>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-text-secondary">
            {answered}/{total}
          </span>
        </div>
      </div>

      {/* Question content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg space-y-6">
          {currentQuestion?.previouslyMissed && (
            <span className="inline-block rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
              Déjà manquée
            </span>
          )}

          <h2 className="text-lg font-medium text-text-primary" style={{ fontSize: "20px" }}>
            {currentQuestion?.questionText}
          </h2>

          {state === "question" && (
            <button onClick={() => setState("answer")} className="btn-primary w-full">
              Voir la réponse
            </button>
          )}

          {state === "answer" && (
            <>
              <div className="card-default">
                <p className="text-sm text-text-secondary">
                  {currentQuestion?.answerExcerpt ?? "Pas d'extrait disponible"}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => submitAnswer(true)}
                  disabled={feedback !== null}
                  className="flex-1 rounded-lg bg-success px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                >
                  ✓ Correct
                </button>
                <button
                  onClick={() => submitAnswer(false)}
                  disabled={feedback !== null}
                  className="flex-1 rounded-lg bg-warning px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-warning/90 disabled:opacity-50"
                >
                  ✗ À revoir
                </button>
              </div>
            </>
          )}

          {/* Feedback toast */}
          {feedback && (
            <div
              className={`animate-fade-in rounded-lg px-4 py-3 text-center text-sm font-medium ${
                feedback === "correct" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              }`}
            >
              {feedback === "correct" ? "✓ Bonne réponse !" : "✗ À revoir"}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
