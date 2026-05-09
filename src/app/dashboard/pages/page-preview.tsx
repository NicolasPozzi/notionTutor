"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { NotionPage } from "@/lib/adapters/notion/types";

interface PagePreviewProps {
  page: NotionPage;
  onClose: () => void;
}

export function PagePreview({ page, onClose }: PagePreviewProps) {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${page.id}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content ?? ""))
      .catch(() => setContent("Impossible de charger le contenu."))
      .finally(() => setLoading(false));
  }, [page.id]);

  const startRevision = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notionPageId: page.id }),
      });

      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      router.push(`/dashboard/revise/${data.sessionId}`);
    } catch {
      setStarting(false);
      alert("Impossible de démarrer la révision. Réessayez.");
    }
  };

  useEffect(() => {
    fetch(`/api/pages/${page.id}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content ?? ""))
      .catch(() => setContent("Impossible de charger le contenu."))
      .finally(() => setLoading(false));
  }, [page.id]);

  // Truncate to ~500 chars for preview
  const preview = content && content.length > 500 ? content.slice(0, 500) + "…" : content;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{page.icon ?? "📄"}</span>
            <h2 className="text-base font-semibold text-text-primary">{page.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Content preview */}
        <div className="mb-6 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-text-secondary">Chargement…</p>
          ) : (
            <p className="whitespace-pre-line text-sm text-text-secondary">{preview}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={startRevision}
            disabled={starting}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {starting ? "Démarrage…" : "Réviser"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
