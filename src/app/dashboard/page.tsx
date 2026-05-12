"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalSessions: number;
  completedSessions: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  masteredQuestions: number;
  activeDigests: number;
}

interface Streak {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats ?? null);
        setStreak(data.streak ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-xl font-semibold text-text-primary">👋 Bienvenue sur NotionTutor</h1>

        {/* Streak */}
        {streak && streak.current > 0 && (
          <div className="card-default text-center">
            <p className="text-2xl">🔥</p>
            <p className="text-lg font-semibold text-streak">
              {streak.current} jour{streak.current > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-text-secondary">
              Record : {streak.longest} jour{streak.longest > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Stats */}
        {stats && stats.totalSessions > 0 && (
          <div className="card-default grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.completedSessions}</p>
              <p className="text-xs text-text-secondary">Sessions</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-success">{stats.accuracyRate}%</p>
              <p className="text-xs text-text-secondary">Précision</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-accent">{stats.masteredQuestions}</p>
              <p className="text-xs text-text-secondary">Maîtrisées</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.activeDigests}</p>
              <p className="text-xs text-text-secondary">Digests actifs</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/pages" className="btn-primary inline-block text-center">
            📚 Mes pages Notion
          </Link>
          <Link href="/dashboard/history" className="btn-secondary inline-block text-center">
            📋 Historique
          </Link>
          <Link href="/dashboard/digests" className="btn-secondary inline-block text-center">
            📧 Mes digests
          </Link>
          <Link href="/dashboard/profile" className="btn-ghost inline-block text-center">
            Mon profil
          </Link>
        </div>
      </div>
    </main>
  );
}
