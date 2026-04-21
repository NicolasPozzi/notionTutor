export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-2xl space-y-6 text-center">
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-text-primary">NotionTutor</h1>

        {/* Tagline */}
        <p className="text-lg text-text-secondary">
          Révisez vos notes Notion avec l&apos;IA
        </p>

        {/* Value proposition */}
        <div className="space-y-4 rounded-lg bg-surface p-6">
          <p className="text-base text-text-primary">
            Transformez vos notes en sessions de révision interactives.
          </p>
          <ul className="space-y-2 text-left text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="text-feedback-success">✓</span>
              Questions générées par IA depuis vos notes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-feedback-success">✓</span>
              Digests email quotidiens style Readwise
            </li>
            <li className="flex items-center gap-2">
              <span className="text-feedback-success">✓</span>
              Spaced repetition pour mémoriser durablement
            </li>
          </ul>
        </div>

        {/* CTA placeholder - will be implemented in Epic 1 */}
        <button
          disabled
          className="min-h-tap min-w-tap rounded-lg bg-text-primary px-6 py-3 text-base font-medium text-background opacity-50"
        >
          Se connecter avec Notion
        </button>
        <p className="text-xs text-text-secondary">
          Authentification Notion à venir (Epic 1)
        </p>
      </div>
    </main>
  );
}
