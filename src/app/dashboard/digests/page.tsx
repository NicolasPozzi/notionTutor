"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Digest {
  id: string;
  notionPageId: string;
  notionPageTitle: string | null;
  frequency: string;
  sendTime: string;
  durationDays: number | null;
  startedAt: string;
  endsAt: string | null;
  lastSentAt: string | null;
  status: string;
}

export default function DigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/digests")
      .then((res) => res.json())
      .then((data) => setDigests(data.digests ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (digest: Digest) => {
    const newStatus = digest.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/digests/${digest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setDigests((prev) => prev.map((d) => (d.id === digest.id ? { ...d, status: newStatus } : d)));
    }
  };

  const deleteDigest = async (id: string) => {
    const res = await fetch(`/api/digests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDigests((prev) => prev.filter((d) => d.id !== id));
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
          <h1 className="text-xl font-semibold text-text-primary">📧 Mes Digests</h1>
          <Link href="/dashboard/pages" className="text-sm text-accent hover:underline">
            + Ajouter
          </Link>
        </div>

        {digests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-text-secondary">Aucun digest configuré</p>
            <p className="mt-2 text-xs text-text-secondary">
              Activez un digest depuis la page d&apos;une note Notion pour recevoir des
              micro-questions par email.
            </p>
            <Link href="/dashboard/pages" className="btn-primary mt-4 inline-block">
              Parcourir mes pages
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {digests.map((digest) => (
              <div key={digest.id} className="card-default flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {digest.notionPageTitle ?? "Page sans titre"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {digest.frequency === "daily" ? "Quotidien" : "Hebdomadaire"} à{" "}
                    {digest.sendTime}
                    {digest.status === "paused" && (
                      <span className="ml-2 text-warning">• En pause</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(digest)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/5"
                  >
                    {digest.status === "active" ? "Pause" : "Reprendre"}
                  </button>
                  <button
                    onClick={() => deleteDigest(digest.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-streak hover:bg-streak/5"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
