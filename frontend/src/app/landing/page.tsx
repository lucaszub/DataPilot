"use client";

import { useState } from "react";

/* ───────────────────────── color tokens ───────────────────────── */
const C = {
  dark: "#0A2118",
  darkAlt: "#071A12",
  green: "#10B981",
  greenDark: "#065F46",
  greenLight: "#D1FAE5",
  greenPale: "#ECFDF5",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
  gray900: "#111827",
};

/* ──────────────────────────── NAVBAR ──────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    "Produit",
    "Solutions",
    "Tarifs",
    "Ressources",
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: C.darkAlt }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <DataPilotLogo size={28} />
            <span className="text-white font-bold text-lg tracking-tight">
              DataPilot
            </span>
          </div>

          {/* Nav links - desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                {item}
                <ChevronDown className="inline-block ml-1 w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:inline-flex text-white/80 hover:text-white text-sm font-medium"
            >
              Se connecter
            </a>
            <a
              href="/register"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded-lg"
              style={{ backgroundColor: C.green }}
            >
              ESSAI GRATUIT
            </a>
            <button
              className="lg:hidden text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 px-4 pb-4">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="block text-white/80 hover:text-white py-2 text-sm"
            >
              {item}
            </a>
          ))}
          <div className="flex gap-3 mt-3">
            <a href="/login" className="text-white/80 text-sm py-2">Se connecter</a>
            <a
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded-lg"
              style={{ backgroundColor: C.green }}
            >
              ESSAI GRATUIT
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ──────────────────────────── HERO ──────────────────────────── */
function Hero() {
  const tabs = [
    "Open Source",
    "Text-to-Chart",
    "Text-to-SQL",
    "Import CSV",
    "Dashboards",
    "Heberge en France",
  ];

  return (
    <section className="relative pt-16 overflow-hidden">
      {/* Geometric crystalline background */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 800"
        >
          <defs>
            <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D1FAE5" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </linearGradient>
            <linearGradient id="tri1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#D1FAE5" />
            </linearGradient>
            <linearGradient id="tri2" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
            <linearGradient id="tri3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BBF7D0" />
              <stop offset="100%" stopColor="#D1FAE5" />
            </linearGradient>
          </defs>
          <rect width="1440" height="800" fill="url(#bg1)" />

          {/* Large crystalline facets */}
          <polygon points="0,0 480,0 240,320" fill="url(#tri1)" opacity="0.7" />
          <polygon points="480,0 720,0 600,280" fill="#FFFFFF" opacity="0.5" />
          <polygon points="240,0 600,0 420,260" fill="url(#tri2)" opacity="0.25" />
          <polygon points="600,0 960,0 780,350" fill="url(#tri1)" opacity="0.55" />
          <polygon points="960,0 1440,0 1200,380" fill="#FFFFFF" opacity="0.45" />
          <polygon points="1100,0 1440,0 1440,280 1270,320" fill="url(#tri3)" opacity="0.4" />

          {/* Middle facets */}
          <polygon points="0,0 0,400 320,200" fill="#FFFFFF" opacity="0.5" />
          <polygon points="0,200 200,80 100,450" fill="url(#tri2)" opacity="0.2" />
          <polygon points="300,100 600,0 450,350" fill="#FFFFFF" opacity="0.35" />
          <polygon points="500,150 800,50 650,400" fill="url(#tri3)" opacity="0.18" />
          <polygon points="800,0 1100,100 950,380" fill="#FFFFFF" opacity="0.4" />
          <polygon points="1000,50 1300,0 1150,350" fill="url(#tri2)" opacity="0.15" />
          <polygon points="1200,100 1440,0 1440,350 1320,380" fill="#FFFFFF" opacity="0.3" />

          {/* Lower facets fading out */}
          <polygon points="0,400 300,300 150,600" fill="#FFFFFF" opacity="0.25" />
          <polygon points="200,350 500,250 350,550" fill="url(#tri2)" opacity="0.12" />
          <polygon points="500,300 800,200 650,550" fill="#FFFFFF" opacity="0.2" />
          <polygon points="700,350 1000,250 850,580" fill="url(#tri3)" opacity="0.1" />
          <polygon points="1000,300 1300,200 1150,550" fill="#FFFFFF" opacity="0.2" />
          <polygon points="1200,350 1440,300 1440,600 1320,560" fill="#FFFFFF" opacity="0.15" />

          {/* Edge highlights */}
          <line x1="240" y1="320" x2="480" y2="0" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
          <line x1="600" y1="280" x2="780" y2="350" stroke="#A7F3D0" strokeWidth="1" opacity="0.4" />
          <line x1="960" y1="0" x2="780" y2="350" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
          <line x1="1200" y1="380" x2="1440" y2="280" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
          <line x1="0" y1="400" x2="320" y2="200" stroke="#A7F3D0" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === 0
                  ? "text-white shadow-md"
                  : "bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-sm"
              }`}
              style={i === 0 ? { backgroundColor: C.green } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="text-center max-w-4xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-6"
            style={{ color: C.dark }}
          >
            LE PREMIER OUTIL OPEN SOURCE
            <br />
            <span style={{ color: C.green }}>TEXT-TO-CHART.</span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: C.gray600 }}>
            Posez une question en francais, obtenez un graphique. Open source, auto-hebergeable,
            concu pour les PME. De vos CSV a vos dashboards en quelques secondes.
          </p>

          {/* Search bar / demo */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200/80 px-5 py-2.5">
              <ChatIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Quel est mon chiffre d'affaires par mois ?"
                className="flex-1 outline-none text-gray-700 text-sm bg-transparent"
              />
              <button
                className="ml-2 px-5 py-2 rounded-full text-white text-xs font-bold flex-shrink-0 hover:brightness-110 transition"
                style={{ backgroundColor: C.green }}
              >
                Demander
              </button>
            </div>
          </div>
        </div>

        {/* Logo illustration */}
        <div className="flex justify-center mt-14">
          <div className="relative">
            <div
              className="absolute rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: C.green, width: 200, height: 200, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            />
            <DataPilotLogo size={100} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FEATURES SECTION ──────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <UploadIcon />,
      title: "1. Importez vos CSV",
      desc: "Glissez-deposez vos fichiers, meme au format francais (point-virgule, virgule decimale). Conversion automatique en Parquet.",
    },
    {
      icon: <AIIcon />,
      title: "2. Posez votre question",
      desc: "Ecrivez en francais : \"Quel est mon CA par mois ?\". L'IA genere le SQL et le graphique automatiquement.",
    },
    {
      icon: <DashboardIcon />,
      title: "3. Obtenez le graphique",
      desc: "Bar chart, line chart, KPI, tableau — le bon format est choisi pour vous. Epinglez-le dans un dashboard en un clic.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p
            className="text-sm font-bold uppercase tracking-widest mb-3"
            style={{ color: C.green }}
          >
            COMMENT CA MARCHE
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: C.dark }}
          >
            DU CSV AU GRAPHIQUE
            <br />
            EN 3 ETAPES
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <div key={i} className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: C.greenLight }}
              >
                {f.icon}
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: C.dark }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.gray600 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-16 flex justify-center">
          <div className="w-24 h-1 rounded-full" style={{ backgroundColor: C.green }} />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── ARCHITECTURE SECTION ────────────────────── */
function ArchitectureSection() {
  return (
    <section style={{ backgroundColor: C.gray50 }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: C.dark }}
          >
            OPEN SOURCE. AUTO-HEBERGEABLE.
            <br />
            <span style={{ color: C.green }}>
              ZERO VENDOR LOCK-IN.
            </span>
          </h2>
        </div>

        {/* Architecture diagram */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 items-center">
            {/* Left: Sources */}
            <div className="space-y-3">
              {["Fichiers CSV", "Exports bancaires", "Donnees comptables", "Fichiers RH"].map(
                (item) => (
                  <div
                    key={item}
                    className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 text-sm font-medium"
                    style={{ color: C.dark }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: C.green }} />
                    {item}
                  </div>
                )
              )}
            </div>

            {/* Center: DataPilot platform */}
            <div
              className="rounded-2xl p-8 text-center text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${C.greenDark}, ${C.dark})`,
              }}
            >
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" viewBox="0 0 400 300">
                  <polygon points="0,0 200,0 100,150" fill="white" opacity="0.3" />
                  <polygon points="200,0 400,0 400,100 300,200" fill="white" opacity="0.2" />
                  <polygon points="0,150 100,100 50,300" fill="white" opacity="0.15" />
                </svg>
              </div>
              <div className="relative z-10">
                <DataPilotLogo size={48} />
                <h3 className="text-2xl font-bold mt-4 mb-2">DataPilot</h3>
                <p className="text-white/70 text-sm">
                  BI conversationnelle tout-en-un pour vos PME
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {["DuckDB", "Claude IA", "Dashboards"].map((s) => (
                    <div
                      key={s}
                      className="bg-white/10 rounded-lg px-3 py-2 text-xs font-medium"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Outputs */}
            <div className="space-y-3">
              {["KPIs & Metriques", "Graphiques interactifs", "Rapports automatises", "Alertes IA"].map(
                (item) => (
                  <div
                    key={item}
                    className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 text-sm font-medium"
                    style={{ color: C.dark }}
                  >
                    {item}
                    <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ backgroundColor: C.green }} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div
            className="rounded-xl p-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
            }}
          >
            <h3 className="text-xl font-bold mb-3">TEXT-TO-CHART</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Question en francais → SQL → graphique. Le premier pipeline
              open source qui transforme du langage naturel en visualisation.
            </p>
            <a href="#" className="inline-flex items-center mt-4 text-white font-semibold text-sm hover:underline">
              Voir sur GitHub <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>
          <div
            className="rounded-xl p-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${C.greenDark}, ${C.dark})`,
            }}
          >
            <h3 className="text-xl font-bold mb-3">AUTO-HEBERGEABLE</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Docker Compose, deployez sur votre serveur en 5 minutes.
              Vos donnees restent chez vous. RGPD natif.
            </p>
            <a href="#" className="inline-flex items-center mt-4 text-white font-semibold text-sm hover:underline">
              En savoir plus <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── LOGOS SECTION ───────────────────────── */
function LogosSection() {
  const logos = [
    "BoursoBank",
    "Qonto",
    "Pennylane",
    "Tiime",
    "Indy",
    "Sage",
    "Cegid",
  ];

  return (
    <section className="py-12 border-y" style={{ borderColor: C.gray200 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-widest mb-6" style={{ color: C.gray400 }}>
          Compatible avec vos outils
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-lg sm:text-xl font-bold tracking-wide opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: C.gray600 }}
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── TESTIMONIAL SECTION ─────────────────────── */
function TestimonialSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold"
            style={{ color: C.dark }}
          >
            POURQUOI{" "}
            <span style={{ color: C.green }}>OPEN SOURCE ?</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Illustration */}
          <div className="relative">
            <div
              className="rounded-2xl p-10 relative overflow-hidden"
              style={{ backgroundColor: C.greenLight }}
            >
              {/* Decorative wave */}
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path d="M0,60 C150,100 350,0 500,40 L500,100 L0,100 Z" fill={C.green} opacity="0.15" />
                <path d="M0,70 C120,30 380,90 500,50 L500,100 L0,100 Z" fill={C.green} opacity="0.1" />
              </svg>
              <div className="relative text-center">
                <div className="w-32 h-12 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: C.greenDark }}>
                    GitHub
                  </span>
                </div>
                <DataPilotLogo size={64} />
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.greenLight }}>
                <DataPilotLogo size={16} />
              </div>
              <span className="text-sm font-semibold" style={{ color: C.green }}>
                100% Open Source — Licence MIT
              </span>
            </div>
            <p className="text-lg leading-relaxed mb-8" style={{ color: C.gray800 }}>
              Les outils de BI coutent des milliers d&apos;euros par mois et
              enferment vos donnees. DataPilot est gratuit, auto-hebergeable,
              et le code est auditable par tous. Vos donnees ne quittent jamais
              votre serveur.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-4xl font-bold" style={{ color: C.green }}>
                  100%
                </p>
                <p className="text-sm mt-1" style={{ color: C.gray600 }}>
                  gratuit et open source
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ color: C.green }}>
                  5 min
                </p>
                <p className="text-sm mt-1" style={{ color: C.gray600 }}>
                  pour deployer via Docker
                </p>
              </div>
            </div>

            <a
              href="#"
              className="inline-flex items-center text-sm font-semibold hover:underline"
              style={{ color: C.green }}
            >
              Voir le repo GitHub <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────── USECASES SECTION ────────────────────────── */
function UsecasesSection() {
  const cards = [
    {
      title: "Direction financiere",
      desc: "Suivez votre tresorerie, analysez vos marges et pilotez votre budget en temps reel depuis vos exports comptables.",
      gradient: `linear-gradient(135deg, ${C.green}22, ${C.greenLight})`,
    },
    {
      title: "Direction commerciale",
      desc: "Visualisez votre pipeline, le CA par client et les tendances de vente. Alertes automatiques sur les ecarts.",
      gradient: `linear-gradient(135deg, ${C.greenDark}22, ${C.greenLight})`,
    },
    {
      title: "Ressources humaines",
      desc: "Turnover, masse salariale, absenteisme — creez des dashboards RH sans dependre de la DSI.",
      gradient: `linear-gradient(135deg, ${C.dark}11, ${C.greenPale})`,
    },
  ];

  return (
    <section style={{ backgroundColor: C.gray50 }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold"
            style={{ color: C.dark }}
          >
            CAS D&apos;USAGE{" "}
            <span style={{ color: C.green }}>PAR METIER</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 relative" style={{ background: card.gradient }}>
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <DataPilotLogo size={80} />
                </div>
              </div>
              <div className="bg-white p-6">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: C.dark }}
                >
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.gray600 }}>
                  {card.desc}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center mt-4 text-sm font-semibold hover:underline"
                  style={{ color: C.green }}
                >
                  Decouvrir <ArrowRight className="ml-1 w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── NEWS SECTION ───────────────────────────── */
function NewsSection() {
  const news = [
    {
      tag: "Produit",
      title: "DataPilot lance son moteur text-to-SQL pour les PME francaises",
      date: "15 fevrier 2026",
    },
    {
      tag: "Securite",
      title: "Hebergement souverain OVH : vos donnees restent en France",
      date: "12 fevrier 2026",
    },
    {
      tag: "Mise a jour",
      title: "Support natif des CSV francais : point-virgule et virgule decimale",
      date: "10 fevrier 2026",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold"
            style={{ color: C.dark }}
          >
            ACTUALITES{" "}
            <span style={{ color: C.green }}>DATAPILOT</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {news.map((item, i) => (
            <article
              key={i}
              className="group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div
                className="h-48 relative"
                style={{
                  background: `linear-gradient(135deg, ${C.green}${
                    ["33", "22", "15"][i]
                  }, ${C.greenLight})`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <DataPilotLogo size={64} />
                </div>
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: C.green }}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs mb-2" style={{ color: C.gray400 }}>
                  {item.date}
                </p>
                <h3
                  className="text-base font-bold leading-snug group-hover:underline"
                  style={{ color: C.dark }}
                >
                  {item.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── CTA SECTION ──────────────────────────── */
function CTASection() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${C.dark}, ${C.greenDark})`,
      }}
    >
      {/* Geometric overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 1440 400" preserveAspectRatio="none">
          <polygon points="0,0 600,0 300,400" fill="white" />
          <polygon points="800,0 1440,0 1440,300 1100,400" fill="white" />
          <polygon points="400,200 700,100 550,400" fill="white" opacity="0.5" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <DataPilotLogo size={56} />
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-6 mb-4">
          DU TEXTE AU GRAPHIQUE.
          <br />
          <span style={{ color: C.green }}>OPEN SOURCE.</span>
        </h2>
        <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
          Le premier outil open source qui transforme vos questions
          en graphiques. Deployez-le sur votre serveur en 5 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white font-bold text-base hover:brightness-110 transition"
            style={{ backgroundColor: C.green }}
          >
            VOIR SUR GITHUB
          </a>
          <a
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white font-bold text-base border-2 border-white/30 hover:border-white/60 transition-colors"
          >
            ESSAYER EN LIGNE
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FOOTER ──────────────────────────────── */
function Footer() {
  const columns = [
    {
      title: "PRODUIT",
      links: [
        "Text-to-SQL",
        "Import CSV",
        "Dashboards",
        "Tarifs",
      ],
    },
    {
      title: "RESSOURCES",
      links: ["Documentation", "Blog", "Guides", "API"],
    },
    {
      title: "ENTREPRISE",
      links: ["A propos", "Securite", "RGPD", "Contact"],
    },
    {
      title: "LEGAL",
      links: ["CGU", "Confidentialite", "Cookies", "Mentions legales"],
    },
  ];

  return (
    <footer style={{ backgroundColor: C.darkAlt }} className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <DataPilotLogo size={24} />
              <span className="text-white font-bold text-lg">DataPilot</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">
              BI conversationnelle pour les PME francaises.
              Heberge en France chez OVH.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">
            &copy; 2026 DataPilot. Tous droits reserves.
          </p>
          <div className="flex items-center gap-4">
            {["Confidentialite", "CGU", "Cookies"].map(
              (link) => (
                <a
                  key={link}
                  href="#"
                  className="text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                  {link}
                </a>
              )
            )}
          </div>
          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[Twitter, LinkedIn, YouTube].map((Icon, i) => (
              <a key={i} href="#" className="text-white/40 hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────── ICONS ──────────────────────────────── */
function DataPilotLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="inline-block"
    >
      {/* Compass / pilot wheel */}
      <circle cx="32" cy="32" r="26" stroke={C.green} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="8" stroke={C.green} strokeWidth="2.5" />
      {/* Cardinal directions */}
      <line x1="32" y1="6" x2="32" y2="24" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="40" x2="32" y2="58" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="32" x2="24" y2="32" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="32" x2="58" y2="32" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
      {/* Needle pointing up-right */}
      <polygon points="32,32 28,28 32,10 36,28" fill={C.green} opacity="0.8" />
      <polygon points="32,32 36,36 32,54 28,36" fill={C.green} opacity="0.3" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function Menu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 4v18M16 4l-6 6M16 4l6 6" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 22v4a2 2 0 002 2h20a2 2 0 002-2v-4" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" stroke={C.green} strokeWidth="2" />
      <circle cx="16" cy="16" r="4" stroke={C.green} strokeWidth="2" />
      <line x1="16" y1="5" x2="16" y2="12" stroke={C.green} strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="27" stroke={C.green} strokeWidth="2" />
      <line x1="5" y1="16" x2="12" y2="16" stroke={C.green} strokeWidth="2" />
      <line x1="20" y1="16" x2="27" y2="16" stroke={C.green} strokeWidth="2" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="10" height="12" rx="2" stroke={C.green} strokeWidth="2" />
      <rect x="18" y="4" width="10" height="7" rx="2" stroke={C.green} strokeWidth="2" />
      <rect x="4" y="20" width="10" height="8" rx="2" stroke={C.green} strokeWidth="2" />
      <rect x="18" y="15" width="10" height="13" rx="2" stroke={C.green} strokeWidth="2" />
    </svg>
  );
}

function Twitter({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTube({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ──────────────────────── MAIN PAGE ──────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Navbar />
      <Hero />
      <FeaturesSection />
      <ArchitectureSection />
      <LogosSection />
      <TestimonialSection />
      <UsecasesSection />
      <NewsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
