"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sources");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm text-muted-foreground">Redirection...</p>
    </div>
  );
}
