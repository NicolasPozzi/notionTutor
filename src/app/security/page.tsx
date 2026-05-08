import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité & Sécurité",
};

export default function SecurityPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">
            Comment vos données sont protégées
          </h1>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🔒 Accès en lecture seule</h2>
          <p className="text-sm text-text-secondary">
            NotionTutor demande uniquement un accès en{" "}
            <strong className="text-text-primary">lecture seule</strong> à vos pages Notion. Nous ne
            pouvons jamais modifier, supprimer ou créer de contenu dans votre espace.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🗑️ Aucun contenu stocké</h2>
          <p className="text-sm text-text-secondary">
            Le contenu de vos notes est traité de manière{" "}
            <strong className="text-text-primary">éphémère</strong> : il est lu pour générer des
            questions, puis immédiatement supprimé de notre mémoire. Seules les questions générées
            sont conservées.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🔐 Chiffrement AES-256</h2>
          <p className="text-sm text-text-secondary">
            Vos tokens d&apos;authentification Notion et les questions générées sont chiffrés avec
            l&apos;algorithme <strong className="text-text-primary">AES-256-GCM</strong>, le même
            standard utilisé par les banques.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🇪🇺 Hébergement en Europe</h2>
          <p className="text-sm text-text-secondary">
            Toutes vos données sont hébergées en{" "}
            <strong className="text-text-primary">Europe (Paris)</strong>, conformément au RGPD.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">✋ Vos droits</h2>
          <p className="text-sm text-text-secondary">
            Vous pouvez à tout moment exporter vos données, révoquer l&apos;accès Notion ou
            supprimer votre compte. Tout est accessible depuis votre profil.
          </p>
        </section>

        <div className="border-t border-border pt-6 text-center">
          <Link href="/" className="btn-primary">
            Commencer avec NotionTutor
          </Link>
        </div>
      </div>
    </main>
  );
}
