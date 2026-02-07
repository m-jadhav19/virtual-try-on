"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function TryOnRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category");
    const query = category ? `?category=${category}` : "";
    router.replace(`/${query}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
}

export default function TryOnRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Redirecting…</p></div>}>
      <TryOnRedirectContent />
    </Suspense>
  );
}
