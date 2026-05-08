"use client";

import { use } from "react";

export function SessionExpiredBanner({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const error = params.error;

  if (error !== "session_expired") return null;

  return (
    <div className="border-warning/30 bg-warning/5 mb-6 w-full max-w-md rounded-lg border p-4 text-center">
      <p className="text-warning text-sm font-medium">
        Votre session a expiré. Veuillez vous reconnecter.
      </p>
      <a href="/api/auth/notion" className="mt-2 inline-block text-sm text-accent hover:underline">
        Se reconnecter →
      </a>
    </div>
  );
}
