export function SessionExpiredBanner() {
  return (
    <div className="mb-6 w-full max-w-md rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
      <p className="text-sm font-medium text-warning">
        Votre session a expiré. Veuillez vous reconnecter.
      </p>
      <a href="/api/auth/notion" className="mt-2 inline-block text-sm text-accent hover:underline">
        Se reconnecter →
      </a>
    </div>
  );
}
