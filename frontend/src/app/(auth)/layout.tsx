import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-3/5 flex-col justify-between overflow-hidden">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-gray-950/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
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
                Connectez vos données.
              </p>
              <p className="text-4xl font-bold text-indigo-400 leading-tight">
                Posez une question.
              </p>
              <p className="text-4xl font-bold text-white leading-tight">
                Obtenez la reponse.
              </p>
            </div>

            <p className="text-lg text-gray-400 max-w-md leading-relaxed">
              La Business Intelligence conversationnelle pour les PME
              francaises.
            </p>

            {/* Feature list */}
            <ul className="space-y-3" aria-label="Fonctionnalites principales">
              {[
                "Connecteurs PostgreSQL / MySQL / CSV",
                "Text-to-SQL : posez vos questions en francais",
                "Dashboards interactifs et partageables",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 ring-1 ring-indigo-500/40">
                    <svg
                      className="h-3 w-3 text-indigo-400"
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
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-600">
            &copy; 2026 DataPilot &mdash; Hberge sur OVH, France
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-2/5 flex-col items-center justify-center px-6 py-12 bg-gray-950">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
