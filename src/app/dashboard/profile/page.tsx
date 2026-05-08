"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.location.href = "/api/account/export";
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setDeleting(false);
      alert("Erreur lors de la suppression. Réessayez.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Chargement…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Utilisateur non trouvé.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            ← Retour au tableau de bord
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">Mon profil</h1>
        </div>

        {/* User Info */}
        <div className="card-default space-y-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">{user.name ?? "—"}</p>
              <p className="text-xs text-text-secondary">{user.email ?? "Pas d'email"}</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            Membre depuis le{" "}
            {new Date(user.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* RGPD Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Vos données (RGPD)</h2>

          {/* Export */}
          <button onClick={handleExport} className="btn-secondary w-full">
            📦 Exporter mes données
          </button>

          {/* Delete */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-lg border border-streak/30 bg-streak/5 px-4 py-3 text-sm font-medium text-streak transition-colors hover:bg-streak/10"
            >
              🗑️ Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-streak/30 bg-streak/5 p-4">
              <p className="text-sm font-medium text-streak">⚠️ Cette action est irréversible</p>
              <p className="text-xs text-text-secondary">
                Toutes vos données seront définitivement supprimées : historique de révisions,
                questions, et informations de compte.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-streak px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-streak/90 disabled:opacity-50"
                >
                  {deleting ? "Suppression…" : "Confirmer la suppression"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security link */}
        <div className="border-t border-border pt-4">
          <Link href="/security" className="text-sm text-accent hover:underline">
            🔒 Politique de confidentialité
          </Link>
        </div>
      </div>
    </main>
  );
}
