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
  notionConnected: boolean;
  notionWorkspaceName: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.location.href = "/api/account/export";
  };

  // Story 1.7 — re-run Notion OAuth to choose / change workspace & shared pages
  // (Notion's native consent UI). Also used to reconnect after a disconnect.
  const handleManageNotion = () => {
    window.location.href = "/api/auth/notion";
  };

  // Story 2.5 — disconnect Notion (revoke token), stay logged in.
  const handleDisconnect = async () => {
    setDisconnecting(true);
    const res = await fetch("/api/auth/notion/disconnect", { method: "POST" });
    if (res.ok) {
      setUser((prev) =>
        prev ? { ...prev, notionConnected: false, notionWorkspaceName: null } : prev
      );
      setShowDisconnectConfirm(false);
    } else {
      alert("Erreur lors de la déconnexion. Réessayez.");
    }
    setDisconnecting(false);
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

        {/* Notion Connection (Stories 1.7 & 2.5) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Connexion Notion</h2>

          <div className="card-default space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {user.notionConnected ? "Connecté" : "Déconnecté"}
                </p>
                <p className="truncate text-sm text-text-secondary">
                  {user.notionConnected ? (
                    <>
                      Workspace :{" "}
                      <span className="font-medium text-text-primary">
                        {user.notionWorkspaceName ?? "nom indisponible"}
                      </span>
                    </>
                  ) : (
                    "Aucun workspace connecté"
                  )}
                </p>
              </div>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  user.notionConnected ? "bg-success" : "bg-streak"
                }`}
                aria-hidden
              />
            </div>

            {user.notionConnected ? (
              <>
                <button onClick={handleManageNotion} className="btn-secondary w-full">
                  🔁 Gérer les workspaces & pages
                </button>
                <p className="text-xs text-text-secondary">
                  Rouvre la fenêtre de consentement Notion pour choisir un autre workspace ou
                  modifier les pages partagées.
                </p>

                {!showDisconnectConfirm ? (
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="w-full rounded-lg border border-streak/30 bg-streak/5 px-4 py-3 text-sm font-medium text-streak transition-colors hover:bg-streak/10"
                  >
                    🔌 Déconnecter Notion
                  </button>
                ) : (
                  <div className="space-y-3 rounded-lg border border-streak/30 bg-streak/5 p-4">
                    <p className="text-sm font-medium text-streak">Déconnecter Notion ?</p>
                    <p className="text-xs text-text-secondary">
                      L&apos;accès à votre workspace sera révoqué et vos pages ne seront plus
                      visibles. Votre compte et votre historique sont conservés : vous pourrez
                      reconnecter Notion à tout moment.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex-1 rounded-lg bg-streak px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-streak/90 disabled:opacity-50"
                      >
                        {disconnecting ? "Déconnexion…" : "Confirmer"}
                      </button>
                      <button
                        onClick={() => setShowDisconnectConfirm(false)}
                        className="btn-ghost flex-1"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={handleManageNotion} className="btn-primary w-full">
                🔗 Reconnecter Notion
              </button>
            )}
          </div>
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
