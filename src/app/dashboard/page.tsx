import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">👋 Bienvenue sur NotionTutor</h1>
        <p className="text-sm text-text-secondary">
          Votre compte est créé. Les fonctionnalités de révision arrivent dans les prochaines
          stories.
        </p>
        <div className="card-default space-y-2 text-left text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Prochaines étapes :</strong>
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Session management (Story 1.3)</li>
            <li>Navigation des pages Notion (Epic 2)</li>
            <li>Sessions de révision IA (Epic 3)</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/profile" className="btn-primary inline-block">
            Mon profil
          </Link>
          <Link href="/" className="btn-secondary inline-block">
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
