"use client";

import { useCallback, useEffect, useState } from "react";

import type { NotionPage } from "@/lib/adapters/notion/types";

import { PagePreview } from "./page-preview";

export default function PagesPage() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPages = useCallback(async (nextCursor?: string | null) => {
    try {
      const url = nextCursor ? `/api/pages?cursor=${nextCursor}` : "/api/pages";
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur inconnue");
      }

      const data = await res.json();
      setPages((prev) => (nextCursor ? [...prev, ...data.pages] : data.pages));
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, []);

  useEffect(() => {
    fetchPages().finally(() => setLoading(false));
  }, [fetchPages]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPages(cursor);
    setLoadingMore(false);
  };

  const filteredPages = pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Chargement des pages…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-sm text-streak">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Réessayer
        </button>
      </main>
    );
  }

  // Empty state
  if (pages.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-lg font-medium text-text-primary">Aucune page partagée</p>
        <p className="max-w-sm text-sm text-text-secondary">
          Partagez des pages avec NotionTutor depuis Notion pour commencer à réviser. Ouvrez une
          page Notion → Partager → Invitez NotionTutor.
        </p>
        <a
          href="https://www.notion.so/help/add-and-manage-connections-with-the-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline"
        >
          Comment partager des pages →
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold text-text-primary">Mes pages Notion</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Rechercher une page…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        {/* Pages list */}
        <div className="space-y-2">
          {filteredPages.length === 0 && search && (
            <p className="py-8 text-center text-sm text-text-secondary">Aucune page trouvée</p>
          )}

          {filteredPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className="card-interactive flex w-full items-center gap-3 text-left"
            >
              <span className="text-lg">{page.icon ?? "📄"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{page.title}</p>
                <p className="text-xs text-text-secondary">
                  Modifié le{" "}
                  {new Date(page.lastEditedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Load more */}
        {hasMore && !search && (
          <button onClick={loadMore} disabled={loadingMore} className="btn-secondary mx-auto block">
            {loadingMore ? "Chargement…" : "Charger plus de pages"}
          </button>
        )}
      </div>

      {/* Page preview bottom sheet */}
      {selectedPage && <PagePreview page={selectedPage} onClose={() => setSelectedPage(null)} />}
    </main>
  );
}
