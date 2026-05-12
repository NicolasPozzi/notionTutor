import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">👋 Bienvenue sur NotionTutor</h1>
        <p className="text-sm text-text-secondary">
          Choisissez une page Notion pour commencer à réviser.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/pages" className="btn-primary inline-block">
            📚 Mes pages Notion
          </Link>
          <Link href="/dashboard/digests" className="btn-secondary inline-block">
            📧 Mes digests
          </Link>
          <Link href="/dashboard/profile" className="btn-secondary inline-block">
            Mon profil
          </Link>
        </div>
      </div>
    </main>
  );
}
