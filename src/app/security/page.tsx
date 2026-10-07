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
          <h2 className="text-lg font-semibold text-text-primary">
            🗑️ Vos notes ne sont pas stockées
          </h2>
          <p className="text-sm text-text-secondary">
            Le contenu de vos pages est lu{" "}
            <strong className="text-text-primary">uniquement au moment</strong> de générer des
            questions, puis n&apos;est pas conservé. Nous gardons seulement les questions générées
            et, pour chacune, un court extrait de réponse, afin de vous les reproposer plus tard.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🤖 Génération par IA</h2>
          <p className="text-sm text-text-secondary">
            Pour créer les questions d&apos;une révision ou d&apos;un digest, le texte de la page
            concernée est envoyé à l&apos;API d&apos;
            <strong className="text-text-primary">OpenAI</strong> (États-Unis). Selon la politique
            d&apos;OpenAI pour son API, ces données ne servent pas à entraîner ses modèles et sont
            conservées au maximum 30 jours pour la détection des abus, puis supprimées.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🔐 Chiffrement AES-256</h2>
          <p className="text-sm text-text-secondary">
            Vos tokens d&apos;authentification Notion, les questions générées et leurs extraits de
            réponse sont chiffrés avec l&apos;algorithme{" "}
            <strong className="text-text-primary">AES-256-GCM</strong> avant d&apos;être
            enregistrés.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">🌍 Où sont vos données</h2>
          <p className="text-sm text-text-secondary">
            Votre compte, vos questions et votre historique sont stockés en{" "}
            <strong className="text-text-primary">Europe</strong>. Certains services que nous
            utilisons sont situés hors de l&apos;Union européenne :
          </p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Supabase</strong> : base de données, en Irlande
            </li>
            <li>
              <strong className="text-text-primary">Vercel</strong> : hébergement de
              l&apos;application, serveurs à Paris
            </li>
            <li>
              <strong className="text-text-primary">OpenAI</strong> : génération des questions, aux
              États-Unis
            </li>
            <li>
              <strong className="text-text-primary">Resend</strong> : envoi des emails de digest
              (qui contiennent une question et un extrait de votre page), aux États-Unis
            </li>
            <li>
              <strong className="text-text-primary">Notion</strong> : source de vos pages, que nous
              lisons sans jamais les modifier
            </li>
          </ul>
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
