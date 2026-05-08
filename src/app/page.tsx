import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-text-primary">NotionTutor</h1>
        <p className="mt-2 text-lg text-text-secondary">Révisez vos notes Notion avec l&apos;IA</p>
        <p className="mt-4 max-w-md text-base text-text-secondary">
          Transformez vos notes en sessions de révision interactives. Mémorisez durablement grâce au
          spaced repetition.
        </p>

        {/* CTA */}
        <a href="/api/auth/notion" className="btn-primary mt-8 gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z"
              fill="currentColor"
            />
          </svg>
          Se connecter avec Notion
        </a>

        {/* Trust indicators */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-xs text-text-secondary">🔒 Accès en lecture seule à vos notes</p>
          <Link href="/security" className="text-xs text-accent underline-offset-2 hover:underline">
            Comment vos données sont protégées
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-surface px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-lg font-semibold text-text-primary">Comment ça marche</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl">
                📚
              </div>
              <h3 className="mt-3 text-sm font-medium text-text-primary">1. Connectez Notion</h3>
              <p className="mt-1 text-xs text-text-secondary">
                Autorisez l&apos;accès en lecture seule à vos pages
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl">
                🤖
              </div>
              <h3 className="mt-3 text-sm font-medium text-text-primary">
                2. L&apos;IA génère des questions
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Des questions pertinentes basées sur vos notes
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl">
                🧠
              </div>
              <h3 className="mt-3 text-sm font-medium text-text-primary">
                3. Révisez et mémorisez
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Spaced repetition pour retenir durablement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-center text-lg font-semibold text-text-primary">
            Pourquoi NotionTutor ?
          </h2>
          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-feedback-success">✓</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Questions générées par IA</p>
                <p className="text-xs text-text-secondary">
                  Des questions qui testent la compréhension, pas la mémorisation
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-feedback-success">✓</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Digests email quotidiens</p>
                <p className="text-xs text-text-secondary">
                  Recevez une micro-question par email, style Readwise
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-feedback-success">✓</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Vos données restent privées</p>
                <p className="text-xs text-text-secondary">
                  Lecture seule, aucun contenu stocké, chiffrement AES-256
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-text-secondary">
        <p>
          NotionTutor —{" "}
          <Link href="/security" className="text-accent hover:underline">
            Confidentialité
          </Link>
        </p>
      </footer>
    </main>
  );
}
