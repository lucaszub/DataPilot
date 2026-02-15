"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────── Stripe-matched colors ──────────────────────── */
const C = {
  brand600: "#635bff",
  brand700: "#4032c8",
  brand50: "#e8e9ff",
  brand25: "#f5f5ff",
  navy: "#0a2540",
  navyLight: "#425466",
  navySoft: "#50617a",
  neutral25: "#f8fafd",
  neutral50: "#e5edf5",
  neutral100: "#d4dee9",
  white: "#fff",
  lemon: "#f9b900",
  magenta: "#f44bcc",
  orange: "#ff6118",
  ruby: "#ea2261",
  green: "#00b261",
  cyan: "#00d4aa",
};

/* ──────────────────────── Gradient blob animation ───────────────────────── */
const blobKeyframes = `
@keyframes blob1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-15px, 15px) scale(0.97); }
}
@keyframes blob2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-20px, 25px) scale(0.95); }
  66% { transform: translate(25px, -10px) scale(1.03); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes barGrow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

/* ─────────────────────── Intersection Observer hook ──────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                              NAVBAR                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navItems = ["Produits", "Solutions", "Développeurs", "Ressources", "Tarifs"];

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 76,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(255,255,255,0.92)" : C.white,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${scrolled ? C.neutral50 : "transparent"}`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link href="/landing" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill={C.brand600} />
          <path d="M8 14L12 10L16 14L20 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 20H20" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: C.navy, letterSpacing: "-0.02em" }}>
          DataPilot
        </span>
      </Link>

      {/* Center nav */}
      <div style={{ display: "flex", gap: 32 }}>
        {navItems.map((item) => (
          <a
            key={item}
            href="#"
            style={{
              fontSize: 15, fontWeight: 400, color: C.navySoft,
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.navy)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.navySoft)}
          >
            {item}
          </a>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link
          href="/login"
          style={{ fontSize: 15, fontWeight: 400, color: C.navy, textDecoration: "none" }}
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 9999,
            background: C.brand600, color: C.white,
            fontSize: 15, fontWeight: 500, textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.brand700)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.brand600)}
        >
          Commencer maintenant
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          HERO SECTION                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section
      style={{
        position: "relative", overflow: "hidden",
        paddingTop: 156, paddingBottom: 100,
        background: C.white,
      }}
    >
      {/* Gradient blobs */}
      <div
        style={{
          position: "absolute", top: -80, right: -40, width: 520, height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,75,204,0.18) 0%, rgba(255,97,24,0.12) 50%, transparent 70%)",
          animation: "blob1 8s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute", top: 200, right: 200, width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,91,255,0.15) 0%, rgba(189,180,255,0.1) 50%, transparent 70%)",
          animation: "blob2 10s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />

      <div
        style={{
          maxWidth: 1264, margin: "0 auto", padding: "0 40px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64,
          alignItems: "center",
        }}
      >
        {/* Left — Copy */}
        <div style={{ animation: "fadeUp 0.8s ease-out both" }}>
          <h1
            style={{
              fontSize: "4rem", fontWeight: 300, lineHeight: 1.05,
              letterSpacing: "-0.025em", color: C.navy,
              margin: 0, marginBottom: 24,
            }}
          >
            L&apos;intelligence
            <br />
            décisionnelle
            <br />
            pour les <span style={{ color: C.brand600 }}>PME françaises</span>
          </h1>
          <p
            style={{
              fontSize: "1.125rem", fontWeight: 300, lineHeight: 1.6,
              color: C.navyLight, maxWidth: 480,
              margin: 0, marginBottom: 40,
            }}
          >
            Des millions de données transformées en décisions. DataPilot unifie
            vos sources, construit des dashboards intelligents et répond à vos
            questions en langage naturel grâce à l&apos;IA.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link
              href="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 9999,
                background: C.brand600, color: C.white,
                fontSize: 16, fontWeight: 500, textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: "0 4px 14px rgba(99,91,255,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.brand700;
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,91,255,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.brand600;
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,91,255,0.3)";
              }}
            >
              Commencer gratuitement
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#produits"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "14px 28px", borderRadius: 9999,
                background: "transparent", color: C.brand600,
                fontSize: 16, fontWeight: 500, textDecoration: "none",
                border: `1px solid ${C.neutral100}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.brand600;
                e.currentTarget.style.background = C.brand25;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.neutral100;
                e.currentTarget.style.background = "transparent";
              }}
            >
              Découvrir les produits
            </a>
          </div>
        </div>

        {/* Right — Dashboard mockup */}
        <div
          style={{
            position: "relative",
            animation: "fadeUp 0.8s ease-out 0.2s both",
          }}
        >
          <HeroDashboardMockup />
        </div>
      </div>
    </section>
  );
}

/* ─────────── Hero Dashboard Mockup (CSS-based Stripe-style visual) ─────── */
function HeroDashboardMockup() {
  const bars = [35, 55, 45, 70, 60, 85, 50, 75, 90, 65, 80, 55];

  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: "85%" }}>
      {/* Main card — chart */}
      <div
        style={{
          position: "absolute", top: "5%", left: "8%", width: "82%", height: "65%",
          background: C.white, borderRadius: 16,
          boxShadow: "0 16px 48px rgba(50,50,93,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: `1px solid ${C.neutral50}`,
          padding: 24, overflow: "hidden",
        }}
      >
        {/* Chart header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 400, color: C.navySoft, marginBottom: 4 }}>Chiffre d&apos;affaires</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: C.navy, letterSpacing: "-0.02em" }}>€247,830</div>
          </div>
          <div
            style={{
              fontSize: 13, fontWeight: 500, color: C.green,
              background: "#e6f9f0", padding: "4px 10px", borderRadius: 9999,
            }}
          >
            +12.5%
          </div>
        </div>

        {/* Bar chart */}
        <div
          style={{
            display: "flex", alignItems: "flex-end", gap: 6,
            height: "calc(100% - 80px)", paddingTop: 8,
          }}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0",
                background: i === bars.length - 3
                  ? `linear-gradient(180deg, ${C.brand600}, #8b5cf6)`
                  : `linear-gradient(180deg, ${C.brand50}, #d6d9fc)`,
                transformOrigin: "bottom",
                animation: `barGrow 0.6s ease-out ${i * 0.05}s both`,
                opacity: i === bars.length - 3 ? 1 : 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating KPI card — top right */}
      <div
        style={{
          position: "absolute", top: 0, right: 0, width: 180,
          background: C.white, borderRadius: 12,
          boxShadow: "0 8px 32px rgba(50,50,93,0.1), 0 2px 6px rgba(0,0,0,0.04)",
          border: `1px solid ${C.neutral50}`,
          padding: "16px 18px",
          animation: "float 4s ease-in-out infinite",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #ffe5da, #ffd8c6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke={C.orange} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 12, fontWeight: 400, color: C.navySoft }}>Clients actifs</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 300, color: C.navy, letterSpacing: "-0.01em", animation: "countUp 0.8s ease-out 0.5s both" }}>
          1,284
        </div>
      </div>

      {/* Floating KPI card — bottom left */}
      <div
        style={{
          position: "absolute", bottom: "2%", left: 0, width: 200,
          background: C.white, borderRadius: 12,
          boxShadow: "0 8px 32px rgba(50,50,93,0.1), 0 2px 6px rgba(0,0,0,0.04)",
          border: `1px solid ${C.neutral50}`,
          padding: "16px 18px",
          animation: "float 4s ease-in-out 1s infinite",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #ffe6f5, #ffd7ef)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 6L10 9L14 3" stroke={C.magenta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 12, fontWeight: 400, color: C.navySoft }}>Croissance</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 300, color: C.navy, animation: "countUp 0.8s ease-out 0.7s both" }}>+34%</span>
          <span style={{ fontSize: 12, color: C.green }}>vs mois dernier</span>
        </div>
      </div>

      {/* Small AI query bubble — bottom right */}
      <div
        style={{
          position: "absolute", bottom: "12%", right: "4%", maxWidth: 210,
          background: C.navy, borderRadius: 12,
          padding: "12px 16px", color: C.white,
          boxShadow: "0 8px 24px rgba(10,37,64,0.3)",
          animation: "float 5s ease-in-out 2s infinite",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          IA Assistant
        </div>
        <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.4 }}>
          &ldquo;Top 5 clients par CA ce trimestre&rdquo;
        </div>
      </div>

      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute", bottom: "-10%", right: "-5%",
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,185,0,0.2) 0%, rgba(255,97,24,0.1) 50%, transparent 70%)",
          filter: "blur(20px)",
          animation: "blob2 7s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     PRODUCT TAGS BAR (Stripe-style)                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const productTags = [
  { name: "Explorer SQL", color: "#864cff" },
  { name: "Dashboards", color: "#00b261" },
  { name: "IA Chat", color: "#f44bcc" },
  { name: "Import CSV", color: "#ff6118" },
  { name: "Modèle ERD", color: "#e8a30b" },
  { name: "Multi-tenant", color: "#ea2261" },
];

function ProductTagsBar() {
  return (
    <section
      style={{
        background: C.white, padding: "32px 0",
        borderBottom: `1px solid ${C.neutral50}`,
      }}
    >
      <div style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, flexWrap: "wrap",
          }}
        >
          {productTags.map((tag) => (
            <a
              key={tag.name}
              href="#produits"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 18px", borderRadius: 9999,
                background: C.neutral25,
                border: `1px solid ${C.neutral50}`,
                fontSize: 14, fontWeight: 400, color: C.navy,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tag.color;
                e.currentTarget.style.background = `${tag.color}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.neutral50;
                e.currentTarget.style.background = C.neutral25;
              }}
            >
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: tag.color,
                }}
              />
              {tag.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       PRODUCT CARDS GRID                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const products = [
  {
    name: "Explorer SQL",
    desc: "Interrogez vos données en SQL ou en glisser-déposer. Visualisez instantanément les résultats en tableaux et graphiques.",
    gradient: ["#864cff", "#5e4cfe"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#864cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
  },
  {
    name: "Dashboards",
    desc: "Construisez des tableaux de bord interactifs par glisser-déposer. KPI, graphiques, tableaux — tout en temps réel.",
    gradient: ["#00d4aa", "#00b261"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b261" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    name: "IA Conversationnelle",
    desc: "Posez vos questions en français. L'IA génère le SQL, exécute la requête et affiche les résultats visuellement.",
    gradient: ["#f98bf9", "#f44bcc"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f44bcc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    name: "Import CSV",
    desc: "Importez vos fichiers CSV, y compris les formats français. Conversion automatique en Parquet pour des requêtes ultra-rapides.",
    gradient: ["#fe8c2d", "#ff6118"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6118" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9,15 12,12 15,15" />
      </svg>
    ),
  },
  {
    name: "Modèle sémantique",
    desc: "Définissez vos relations entre tables visuellement. L'éditeur ERD génère automatiquement les jointures SQL.",
    gradient: ["#ffd552", "#f9b900"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8a30b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    name: "Multi-tenant",
    desc: "Isolation totale des données par organisation. Chaque tenant a son propre espace sécurisé et ses propres sources.",
    gradient: ["#f84c31", "#ea2261"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea2261" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function ProductGrid() {
  const { ref, visible } = useInView();
  return (
    <section id="produits" style={{ background: C.neutral25, padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <p
          style={{
            fontSize: 16, fontWeight: 500, color: C.brand600,
            marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          Produits
        </p>
        <h2
          style={{
            fontSize: "2.75rem", fontWeight: 300, lineHeight: 1.1,
            letterSpacing: "-0.02em", color: C.navy,
            margin: 0, marginBottom: 16, maxWidth: 640,
          }}
        >
          Des centaines de PME transforment leurs données avec DataPilot
        </h2>
        <p
          style={{
            fontSize: "1.125rem", fontWeight: 300, lineHeight: 1.5,
            color: C.navyLight, maxWidth: 560, marginBottom: 56,
          }}
        >
          Une plateforme complète pour importer, modéliser, explorer et
          visualiser vos données — sans compétences techniques requises.
        </p>

        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {products.map((p, i) => (
            <div
              key={p.name}
              style={{
                background: C.white, borderRadius: 12,
                padding: 28,
                border: `1px solid ${C.neutral50}`,
                transition: "all 0.25s ease",
                cursor: "pointer",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(50,50,93,0.1)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "transparent";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = C.neutral50;
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${p.gradient[0]}15, ${p.gradient[1]}10)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.125rem", fontWeight: 400, color: C.navy,
                  margin: 0, marginBottom: 8, letterSpacing: "-0.01em",
                }}
              >
                {p.name}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem", fontWeight: 300, lineHeight: 1.5,
                  color: C.navyLight, margin: 0, marginBottom: 16,
                }}
              >
                {p.desc}
              </p>
              <span
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: C.brand600,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                En savoir plus
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    FEATURE SHOWCASE SECTION                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function FeatureShowcase() {
  const { ref, visible } = useInView();
  return (
    <section style={{ background: C.white, padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontSize: "2.75rem", fontWeight: 300, lineHeight: 1.1,
              letterSpacing: "-0.02em", color: C.navy,
              margin: "0 auto 16px",
            }}
          >
            La suite DataPilot
          </h2>
          <p
            style={{
              fontSize: "1.125rem", fontWeight: 300, color: C.navyLight,
              maxWidth: 520, margin: "0 auto",
            }}
          >
            Chaque module s&apos;intègre parfaitement aux autres pour créer une
            expérience analytique fluide et puissante.
          </p>
        </div>

        {/* 2×2 Feature cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Card 1 — Explorer */}
          <FeatureCard
            visible={visible}
            delay={0}
            bg="linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)"
            title="Explorer SQL"
            subtitle="Requêtes visuelles et textuelles"
          >
            <div style={{ position: "relative", width: "100%", height: 220 }}>
              {/* Fake SQL editor */}
              <div
                style={{
                  position: "absolute", top: 0, left: 20, right: 20, height: 90,
                  background: "rgba(255,255,255,0.08)", borderRadius: 8,
                  padding: "12px 16px", fontFamily: "monospace",
                  fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                }}
              >
                <span style={{ color: "#9a9afe" }}>SELECT</span> client,{" "}
                <span style={{ color: "#00d4aa" }}>SUM</span>(montant)
                <br />
                <span style={{ color: "#9a9afe" }}>FROM</span> ventes
                <br />
                <span style={{ color: "#9a9afe" }}>GROUP BY</span> client{" "}
                <span style={{ color: "#9a9afe" }}>LIMIT</span> 10
              </div>
              {/* Fake result table */}
              <div
                style={{
                  position: "absolute", bottom: 0, left: 20, right: 20, height: 110,
                  background: "rgba(255,255,255,0.06)", borderRadius: 8,
                  padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.6)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 6, marginBottom: 6, color: "rgba(255,255,255,0.4)" }}>
                  <span>client</span><span>sum(montant)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
                  <span>Acme SAS</span><span style={{ color: C.cyan }}>€48,230</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
                  <span>TechCorp</span><span style={{ color: C.cyan }}>€35,120</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <span>Innov SA</span><span style={{ color: C.cyan }}>€29,850</span>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Card 2 — Dashboards */}
          <FeatureCard
            visible={visible}
            delay={0.1}
            bg="linear-gradient(135deg, #1c1e54 0%, #2e2b8c 100%)"
            title="Dashboards"
            subtitle="Visualisations temps réel"
          >
            <div style={{ position: "relative", width: "100%", height: 220 }}>
              {/* Mini dashboard grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px" }}>
                {/* KPI widget */}
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Revenus</div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: C.white }}>€1.2M</div>
                  <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>+18.2%</div>
                </div>
                {/* KPI widget 2 */}
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Commandes</div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: C.white }}>3,847</div>
                  <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>+9.4%</div>
                </div>
                {/* Mini line chart */}
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 14, gridColumn: "span 2", height: 100 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Tendance mensuelle</div>
                  <svg width="100%" height="50" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.brand600} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={C.brand600} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,40 Q20,35 40,30 T80,20 T120,25 T160,10 T200,5" fill="none" stroke={C.brand600} strokeWidth="2" />
                    <path d="M0,40 Q20,35 40,30 T80,20 T120,25 T160,10 T200,5 L200,50 L0,50 Z" fill="url(#lineGrad)" />
                  </svg>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Card 3 — IA */}
          <FeatureCard
            visible={visible}
            delay={0.2}
            bg="linear-gradient(135deg, #4f2055 0%, #a51d85 100%)"
            title="IA Conversationnelle"
            subtitle="Questions en langage naturel"
          >
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12, height: 220, justifyContent: "center" }}>
              {/* User bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px 12px 4px 12px", padding: "10px 14px", maxWidth: "80%", fontSize: 13, color: C.white, fontWeight: 300 }}>
                  Quel est le panier moyen par région ce trimestre ?
                </div>
              </div>
              {/* AI bubble */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", maxWidth: "85%", fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 300, lineHeight: 1.5 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>SQL généré automatiquement</div>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                    SELECT région, AVG(montant)...
                  </span>
                  <div style={{ marginTop: 8, fontSize: 12, color: C.cyan }}>
                    3 résultats trouvés
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Card 4 — CSV + DuckDB */}
          <FeatureCard
            visible={visible}
            delay={0.3}
            bg="linear-gradient(135deg, #56281b 0%, #ab3500 100%)"
            title="Moteur DuckDB"
            subtitle="Performances analytiques"
          >
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, height: 220, justifyContent: "center" }}>
              {/* File upload visual */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.white, fontWeight: 400 }}>ventes_2024.csv</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>2.4 MB — 12,847 lignes</div>
                </div>
              </div>
              {/* Arrow */}
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Parquet output */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${C.orange}40, ${C.lemon}30)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2l8 6-8 6V2z" fill="rgba(255,255,255,0.8)" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.white, fontWeight: 400 }}>processed.parquet</div>
                  <div style={{ fontSize: 11, color: C.green }}>Requêtes 100x plus rapides</div>
                </div>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  bg, title, subtitle, children, visible, delay,
}: {
  bg: string; title: string; subtitle: string;
  children: React.ReactNode; visible: boolean; delay: number;
}) {
  return (
    <div
      style={{
        background: bg, borderRadius: 16, padding: 32, overflow: "hidden",
        minHeight: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `all 0.6s ease ${delay}s`,
      }}
    >
      <h3
        style={{
          fontSize: "1.375rem", fontWeight: 400, color: C.white,
          margin: 0, marginBottom: 4, letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.55)",
          margin: 0, marginBottom: 24,
        }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      HOW IT WORKS — 3 STEPS                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
const steps = [
  {
    num: "01",
    title: "Importez vos données",
    desc: "Glissez-déposez vos fichiers CSV ou connectez vos bases de données. DataPilot détecte automatiquement les schémas et convertit en Parquet pour des performances optimales.",
    color: C.orange,
  },
  {
    num: "02",
    title: "Modélisez visuellement",
    desc: "Créez votre modèle sémantique avec l'éditeur ERD drag & drop. Définissez les relations entre vos tables, les dimensions et les mesures — sans écrire une ligne de SQL.",
    color: C.brand600,
  },
  {
    num: "03",
    title: "Explorez et décidez",
    desc: "Interrogez vos données en langage naturel ou en SQL. Construisez des dashboards interactifs et partagez-les avec votre équipe en un clic.",
    color: C.magenta,
  },
];

function HowItWorks() {
  const { ref, visible } = useInView();
  return (
    <section style={{ background: C.neutral25, padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 14, fontWeight: 500, color: C.brand600,
              marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em",
            }}
          >
            Comment ça marche
          </p>
          <h2
            style={{
              fontSize: "2.5rem", fontWeight: 300, lineHeight: 1.1,
              letterSpacing: "-0.02em", color: C.navy,
              margin: "0 auto 16px",
            }}
          >
            De la donnée brute à la décision en 3 étapes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {steps.map((step, i) => (
            <div
              key={step.num}
              style={{
                position: "relative", padding: 32,
                background: C.white, borderRadius: 16,
                border: `1px solid ${C.neutral50}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease ${i * 0.12}s`,
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontSize: 48, fontWeight: 200, color: `${step.color}20`,
                  lineHeight: 1, marginBottom: 16,
                  letterSpacing: "-0.04em",
                }}
              >
                {step.num}
              </div>
              <h3
                style={{
                  fontSize: "1.25rem", fontWeight: 400, color: C.navy,
                  margin: "0 0 12px", letterSpacing: "-0.01em",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 15, fontWeight: 300, lineHeight: 1.55,
                  color: C.navyLight, margin: 0,
                }}
              >
                {step.desc}
              </p>
              {/* Connector line between steps */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute", top: "50%", right: -16,
                    width: 32, height: 1,
                    background: C.neutral100,
                    display: "block",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    SOVEREIGNTY / DARK SECTION                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SovereigntySection() {
  const { ref, visible } = useInView();
  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0d253d 50%, #11273e 100%)`,
        padding: "100px 0",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left — text */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-20px)",
              transition: "all 0.7s ease",
            }}
          >
            <p
              style={{
                fontSize: 14, fontWeight: 500, color: C.cyan,
                marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em",
              }}
            >
              Souveraineté des données
            </p>
            <h2
              style={{
                fontSize: "2.5rem", fontWeight: 300, lineHeight: 1.1,
                letterSpacing: "-0.02em", color: C.white,
                margin: 0, marginBottom: 20,
              }}
            >
              Vos données restent en France
            </h2>
            <p
              style={{
                fontSize: "1.0625rem", fontWeight: 300, lineHeight: 1.6,
                color: "rgba(255,255,255,0.6)", marginBottom: 32,
              }}
            >
              Hébergement souverain sur infrastructure OVH. Conformité RGPD
              native. Isolation multi-tenant avec chiffrement bout en bout.
              Vos données ne quittent jamais le territoire français.
            </p>
            <div style={{ display: "flex", gap: 32 }}>
              {[
                { label: "RGPD", value: "Conforme" },
                { label: "Hébergement", value: "OVH France" },
                { label: "Chiffrement", value: "AES-256" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 300, color: C.white, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.7s ease 0.2s",
              position: "relative",
            }}
          >
            {/* France map silhouette (simplified SVG) */}
            <div
              style={{
                width: "100%", aspectRatio: "1/1", position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute", inset: "10%", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(99,91,255,0.15) 0%, transparent 70%)",
                }}
              />
              <svg width="260" height="280" viewBox="0 0 260 280" fill="none" style={{ position: "relative" }}>
                {/* Simplified hexagonal France shape */}
                <path
                  d="M130,20 L200,60 L220,140 L190,220 L130,260 L70,220 L40,140 L60,60 Z"
                  fill="rgba(99,91,255,0.1)"
                  stroke="rgba(99,91,255,0.3)"
                  strokeWidth="1.5"
                />
                {/* Data center dots */}
                {[
                  { x: 130, y: 100, label: "Paris" },
                  { x: 100, y: 160, label: "Lyon" },
                  { x: 160, y: 150, label: "Strasbourg" },
                ].map((d) => (
                  <g key={d.label}>
                    <circle cx={d.x} cy={d.y} r="12" fill="rgba(99,91,255,0.15)" />
                    <circle cx={d.x} cy={d.y} r="5" fill={C.brand600} />
                    <circle cx={d.x} cy={d.y} r="5" fill={C.brand600} style={{ animation: "pulse 2s ease-in-out infinite" }} />
                    <text x={d.x} y={d.y + 24} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="300">
                      {d.label}
                    </text>
                  </g>
                ))}
                {/* Connection lines */}
                <line x1="130" y1="100" x2="100" y2="160" stroke="rgba(99,91,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="130" y1="100" x2="160" y2="150" stroke="rgba(99,91,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="100" y1="160" x2="160" y2="150" stroke="rgba(99,91,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     INTEGRATION SECTION                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
function IntegrationSection() {
  const { ref, visible } = useInView();
  return (
    <section style={{ background: C.white, padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 14, fontWeight: 500, color: C.brand600,
              marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em",
            }}
          >
            Intégrations
          </p>
          <h2
            style={{
              fontSize: "2.5rem", fontWeight: 300, lineHeight: 1.1,
              letterSpacing: "-0.02em", color: C.navy,
              margin: "0 auto 16px",
            }}
          >
            Connectez toutes vos sources
          </h2>
          <p
            style={{
              fontSize: "1.125rem", fontWeight: 300, color: C.navyLight,
              maxWidth: 500, margin: "0 auto",
            }}
          >
            Importez vos CSV, connectez vos bases de données, et unifiez vos
            données en quelques clics.
          </p>
        </div>

        {/* Integration flow */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 24, flexWrap: "wrap",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.1s",
          }}
        >
          {/* Source cards */}
          {[
            { name: "CSV / Excel", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", color: C.green },
            { name: "PostgreSQL", icon: "M4 7v10c0 2 4 4 8 4s8-2 8-4V7M4 7c0 2 4 4 8 4s8-2 8-4M4 7c0-2 4-4 8-4s8 2 8 4", color: "#336791" },
            { name: "MySQL", icon: "M4 7v10c0 2 4 4 8 4s8-2 8-4V7M4 7c0 2 4 4 8 4s8-2 8-4M4 7c0-2 4-4 8-4s8 2 8 4", color: "#00758f" },
            { name: "API REST", icon: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71", color: C.orange },
          ].map((s, i) => (
            <div
              key={s.name}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                padding: "24px 32px", borderRadius: 12,
                border: `1px solid ${C.neutral50}`,
                background: C.white,
                transition: "all 0.3s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${i * 0.1}s`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(50,50,93,0.08)";
                e.currentTarget.style.borderColor = s.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = C.neutral50;
              }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${s.color}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 400, color: C.navy }}>{s.name}</span>
            </div>
          ))}

          {/* Arrow */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M5 12h14M13 5l7 7-7 7" stroke={C.navySoft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* DataPilot center */}
          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "28px 40px", borderRadius: 16,
              background: `linear-gradient(135deg, ${C.brand600}, ${C.brand700})`,
              boxShadow: "0 12px 40px rgba(99,91,255,0.3)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="rgba(255,255,255,0.2)" />
              <path d="M8 14L12 10L16 14L20 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 20H20" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.white }}>DataPilot</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        SOCIAL PROOF                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SocialProof() {
  const { ref, visible } = useInView();
  const logos = ["Carrefour", "Decathlon", "BNP Paribas", "Société Générale", "L'Oréal", "Renault", "Michelin", "Danone"];

  return (
    <section style={{ background: C.neutral25, padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <p
          style={{
            textAlign: "center", fontSize: 15, fontWeight: 300,
            color: C.navySoft, marginBottom: 40,
          }}
        >
          Elles font confiance à DataPilot
        </p>
        <div
          style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 48, flexWrap: "wrap",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        >
          {logos.map((name, i) => (
            <div
              key={name}
              style={{
                fontSize: 18, fontWeight: 600, color: C.neutral100,
                letterSpacing: "-0.01em",
                transition: "color 0.3s ease",
                cursor: "default",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transitionDelay: `${i * 0.06}s`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.navySoft)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.neutral100)}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Testimonial quote */}
        <div
          style={{
            maxWidth: 640, margin: "56px auto 0", textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s ease 0.3s",
          }}
        >
          <blockquote
            style={{
              fontSize: "1.375rem", fontWeight: 300, lineHeight: 1.4,
              color: C.navy, letterSpacing: "-0.01em",
              margin: 0, marginBottom: 20,
              fontStyle: "normal",
            }}
          >
            &ldquo;DataPilot a transformé la façon dont nos équipes accèdent
            aux données. Ce qui prenait des heures se fait maintenant en
            quelques secondes.&rdquo;
          </blockquote>
          <div style={{ fontSize: 15, fontWeight: 400, color: C.navy }}>
            Marie Dupont
          </div>
          <div style={{ fontSize: 14, fontWeight: 300, color: C.navySoft }}>
            Directrice Data, TechCorp France
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                         CTA BANNER                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
function CTABanner() {
  const { ref, visible } = useInView();
  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${C.brand600} 0%, #8b5cf6 50%, ${C.magenta} 100%)`,
        padding: "88px 0",
        position: "relative", overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.1,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 40%)",
        }}
      />
      <div
        ref={ref}
        style={{
          maxWidth: 1264, margin: "0 auto", padding: "0 40px",
          textAlign: "center", position: "relative",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s ease",
        }}
      >
        <h2
          style={{
            fontSize: "2.75rem", fontWeight: 300, lineHeight: 1.1,
            letterSpacing: "-0.02em", color: C.white,
            margin: "0 0 16px",
          }}
        >
          Prêt à transformer vos données ?
        </h2>
        <p
          style={{
            fontSize: "1.125rem", fontWeight: 300, color: "rgba(255,255,255,0.75)",
            maxWidth: 480, margin: "0 auto 36px",
          }}
        >
          Commencez gratuitement. Pas de carte bancaire requise.
          Configurez votre premier dashboard en 5 minutes.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 9999,
              background: C.white, color: C.navy,
              fontSize: 16, fontWeight: 500, textDecoration: "none",
              transition: "all 0.2s",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.15)";
            }}
          >
            Commencer gratuitement
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 9999,
              background: "rgba(255,255,255,0.15)", color: C.white,
              fontSize: 16, fontWeight: 500, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            Contacter l&apos;équipe
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FOOTER                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  const cols = [
    {
      title: "Produits",
      links: ["Explorer SQL", "Dashboards", "IA Conversationnelle", "Import CSV", "Modèle sémantique", "API"],
    },
    {
      title: "Ressources",
      links: ["Documentation", "Guides", "Blog", "Changelog", "État du système"],
    },
    {
      title: "Entreprise",
      links: ["À propos", "Clients", "Tarifs", "Partenaires", "Carrières"],
    },
    {
      title: "Légal",
      links: ["Confidentialité", "CGU", "RGPD", "Sécurité", "Cookies"],
    },
  ];

  return (
    <footer style={{ background: C.white, borderTop: `1px solid ${C.neutral50}`, padding: "64px 0 40px" }}>
      <div style={{ maxWidth: 1264, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 56 }}>
          {/* Brand column */}
          <div>
            <Link href="/landing" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill={C.brand600} />
                <path d="M8 14L12 10L16 14L20 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 20H20" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>DataPilot</span>
            </Link>
            <p style={{ fontSize: 14, fontWeight: 300, color: C.navySoft, lineHeight: 1.5, maxWidth: 220 }}>
              L&apos;intelligence décisionnelle souveraine pour les PME françaises.
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 16 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      fontSize: 14, fontWeight: 300, color: C.navySoft,
                      textDecoration: "none", transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.brand600)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.navySoft)}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: `1px solid ${C.neutral50}`, paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 300, color: C.navySoft }}>
            &copy; 2026 DataPilot. Tous droits réservés.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Country selector */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 6,
                border: `1px solid ${C.neutral50}`,
                fontSize: 13, fontWeight: 300, color: C.navySoft,
              }}
            >
              <span>🇫🇷</span> France (FR)
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          MAIN PAGE                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: blobKeyframes }} />
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
          color: C.navy,
          background: C.white,
        }}
      >
        <Navbar />
        <HeroSection />
        <ProductTagsBar />
        <ProductGrid />
        <FeatureShowcase />
        <HowItWorks />
        <SovereigntySection />
        <IntegrationSection />
        <SocialProof />
        <CTABanner />
        <Footer />
      </div>
    </>
  );
}
