import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-3/5 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.5V21h4.5v-7.5H3zm7-9V21H14.5V4.5H10zm7 4.5V21H21.5v-12H17z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              DataPilot
            </span>
          </div>

          {/* Main tagline */}
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-white leading-tight">
                Connectez vos donnees.
              </p>
              <p className="text-4xl font-bold text-white/80 leading-tight">
                Posez une question.
              </p>
              <p className="text-4xl font-bold text-white leading-tight">
                Obtenez la reponse.
              </p>
            </div>

            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              La Business Intelligence conversationnelle pour les PME
              francaises.
            </p>

            {/* Feature list */}
            <ul className="space-y-3" aria-label="Fonctionnalites principales">
              {[
                "Importez vos fichiers CSV en glisser-deposer",
                "Modele semantique visuel avec relations",
                "Dashboards interactifs et partageables",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/40">
            &copy; 2026 DataPilot &mdash; Heberge sur OVH, France
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-2/5 flex-col items-center justify-center px-6 py-12 bg-card">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
