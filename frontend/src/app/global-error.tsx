"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <h2 style={{ marginBottom: 16 }}>Une erreur est survenue</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>{error.message}</p>
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
