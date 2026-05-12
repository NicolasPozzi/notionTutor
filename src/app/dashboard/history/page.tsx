"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionItem {
  id: string;
  notionPageTitle: string | null;
  status: string;
  questionsTotal: number;
  correctCount: number;
  startedAt: string;
  completedAt: string | null;
}

interface AttemptDetail {
  id: string;
  isCorrect: boolean;
  question: { id: string; questionText: string };
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptDetail[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleSession = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(sessionId);
    setLoadingAttempts(true);
    try {
      const res = await fetch(`/api/history/${sessionId}`);
      const data = await res.json();
      setAttempts(data.attempts ?? []);
    } catch {
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">📋 Historique</h1>
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            ← Retour
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-text-secondary">Aucune session de révision</p>
            <Link href="/dashboard/pages" className="btn-primary mt-4 inline-block">
              Commencer à réviser
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => toggleSession(s.id)}
                  className="card-interactive flex w-full items-center justify-between text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {s.notionPageTitle ?? "Session"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(s.startedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" • "}
                      {s.status === "completed"
                        ? "Terminée"
                        : s.status === "abandoned"
                          ? "Abandonnée"
                          : "En cours"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">
                      {s.correctCount}/{s.questionsTotal}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {s.questionsTotal > 0
                        ? Math.round((s.correctCount / s.questionsTotal) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === s.id && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-border pl-4">
                    {loadingAttempts ? (
                      <p className="text-xs text-text-secondary">Chargement…</p>
                    ) : attempts.length === 0 ? (
                      <p className="text-xs text-text-secondary">Aucun détail</p>
                    ) : (
                      attempts.map((a) => (
                        <div key={a.id} className="flex items-start gap-2 text-xs">
                          <span className={a.isCorrect ? "text-success" : "text-warning"}>
                            {a.isCorrect ? "✓" : "✗"}
                          </span>
                          <span
                            className={`${!a.isCorrect ? "text-warning" : "text-text-secondary"}`}
                          >
                            {a.question.questionText}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
