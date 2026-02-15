import { useState } from "react";

// ─────────────────────────────────────────────
// SHARED MOCK DATA
// ─────────────────────────────────────────────
const sqlCode = `SELECT
  date_trunc('month', o.created_at) AS mois,
  c.category,
  SUM(o.amount) AS total_revenue,
  COUNT(*) AS nb_orders,
  AVG(o.amount) AS avg_order
FROM orders o
LEFT JOIN customers c
  ON o.customer_id = c.id
WHERE o.created_at >= '2025-01-01'
GROUP BY 1, 2
ORDER BY 1 DESC
LIMIT 100`;

const sqlKeywords = ["SELECT", "FROM", "LEFT JOIN", "ON", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "AS", "SUM", "COUNT", "AVG", "DESC"];
const sqlFunctions = ["date_trunc", "SUM", "COUNT", "AVG"];
const sqlStrings = ["'month'", "'2025-01-01'"];

const spreadsheetData = [
  { mois: "2025-12", category: "Électronique", revenue: "€45 200", orders: 142, avg: "€318" },
  { mois: "2025-12", category: "Textile", revenue: "€23 800", orders: 89, avg: "€267" },
  { mois: "2025-11", category: "Électronique", revenue: "€52 100", orders: 168, avg: "€310" },
  { mois: "2025-11", category: "Textile", revenue: "€19 400", orders: 74, avg: "€262" },
  { mois: "2025-11", category: "Alimentaire", revenue: "€15 600", orders: 312, avg: "€50" },
  { mois: "2025-10", category: "Électronique", revenue: "€38 900", orders: 125, avg: "€311" },
  { mois: "2025-10", category: "Services", revenue: "€28 300", orders: 56, avg: "€505" },
  { mois: "2025-10", category: "Alimentaire", revenue: "€14 200", orders: 289, avg: "€49" },
];

const sidebarModels = [
  { name: "orders", icon: "📦", fields: ["order_id", "created_at", "amount", "customer_id", "status"] },
  { name: "customers", icon: "👤", fields: ["id", "name", "email", "category", "region"] },
  { name: "products", icon: "🏷️", fields: ["product_id", "name", "price", "stock", "category"] },
];

const autocompleteItems = [
  { label: "orders", type: "model", desc: "Table commandes" },
  { label: "total_revenue", type: "metric", desc: "SUM(amount)" },
  { label: "nb_orders", type: "metric", desc: "COUNT(*)" },
  { label: "category", type: "dim", desc: "Catégorie produit" },
  { label: "created_at", type: "dim", desc: "Date de commande" },
];

const cols = ["mois", "category", "revenue", "orders", "avg"];

// ─────────────────────────────────────────────
// MINI COMPONENTS
// ─────────────────────────────────────────────
const colorizeSQL = (code, t) => {
  const lines = code.split("\n");
  return lines.map((line, li) => {
    let parts = [];
    let remaining = line;
    let idx = 0;
    // simple token-based coloring
    const tokens = remaining.split(/(\s+|[(),.*>=<'])/);
    tokens.forEach((token, ti) => {
      if (sqlKeywords.includes(token.toUpperCase())) {
        parts.push(<span key={`${li}-${ti}`} style={{ color: t.kwColor, fontWeight: 600 }}>{token}</span>);
      } else if (sqlFunctions.includes(token)) {
        parts.push(<span key={`${li}-${ti}`} style={{ color: t.fnColor }}>{token}</span>);
      } else if (token.startsWith("'")) {
        parts.push(<span key={`${li}-${ti}`} style={{ color: t.strColor }}>{token}</span>);
      } else if (/^\d+$/.test(token)) {
        parts.push(<span key={`${li}-${ti}`} style={{ color: t.numColor }}>{token}</span>);
      } else {
        parts.push(<span key={`${li}-${ti}`}>{token}</span>);
      }
    });
    return <div key={li} style={{ minHeight: 20 }}><span style={{ color: t.lineNumColor, marginRight: 16, userSelect: "none", display: "inline-block", width: 20, textAlign: "right" }}>{li + 1}</span>{parts}</div>;
  });
};

// ─────────────────────────────────────────────
// 10 THEME DEFINITIONS
// ─────────────────────────────────────────────
const explorerThemes = [
  {
    id: "omni-classic",
    name: "① Omni Classic",
    desc: "Reproduction fidèle du style Omni — blanc, sidebar gauche, split SQL/Results, tabs Chart/Both",
    bg: "#FAFBFC", panelBg: "#FFFFFF", text: "#1A1D21", sub: "#6B7280",
    border: "#E5E7EB", accent: "#0D9488", accentText: "#fff",
    editorBg: "#FAFBFC", kwColor: "#7C3AED", fnColor: "#0D9488", strColor: "#D97706",
    numColor: "#2563EB", lineNumColor: "#D1D5DB", editorText: "#1A1D21",
    headerBg: "#FFFFFF", tabActiveBg: "#0D9488", tabActiveText: "#fff",
    sidebarBg: "#F9FAFB", sidebarBorder: "#E5E7EB",
    cellHover: "#F0FDFA", selectedRow: "#CCFBF1",
    radius: 8, font: "'DM Sans', sans-serif", monoFont: "'Fira Code', monospace",
    layout: "sidebar-left",
  },
  {
    id: "vscode-dark",
    name: "② VS Code Dark",
    desc: "Thème sombre inspiré VS Code — familier pour les devs, coloration Monokai-like",
    bg: "#1E1E1E", panelBg: "#252526", text: "#D4D4D4", sub: "#808080",
    border: "#333333", accent: "#569CD6", accentText: "#fff",
    editorBg: "#1E1E1E", kwColor: "#569CD6", fnColor: "#DCDCAA", strColor: "#CE9178",
    numColor: "#B5CEA8", lineNumColor: "#5A5A5A", editorText: "#D4D4D4",
    headerBg: "#2D2D2D", tabActiveBg: "#1E1E1E", tabActiveText: "#fff",
    sidebarBg: "#252526", sidebarBorder: "#333333",
    cellHover: "#2A2D2E", selectedRow: "#264F78",
    radius: 2, font: "'Segoe UI', sans-serif", monoFont: "'Cascadia Code', 'Fira Code', monospace",
    layout: "sidebar-left",
  },
  {
    id: "notion-minimal",
    name: "③ Notion Minimal",
    desc: "Ultra épuré façon Notion — pas de sidebar, commande palette, focus contenu",
    bg: "#FFFFFF", panelBg: "#FFFFFF", text: "#37352F", sub: "#9B9A97",
    border: "#E9E9E7", accent: "#2EAADC", accentText: "#fff",
    editorBg: "#FBFBFA", kwColor: "#EB5757", fnColor: "#6940A5", strColor: "#0B6E99",
    numColor: "#EB5757", lineNumColor: "#CFCFCE", editorText: "#37352F",
    headerBg: "#FFFFFF", tabActiveBg: "transparent", tabActiveText: "#37352F",
    sidebarBg: "#FFFFFF", sidebarBorder: "transparent",
    cellHover: "#F7F6F3", selectedRow: "#E8F5FE",
    radius: 3, font: "'Charter', 'Georgia', serif", monoFont: "'SFMono-Regular', 'Fira Code', monospace",
    layout: "no-sidebar",
  },
  {
    id: "retro-amber",
    name: "④ Retro Amber Terminal",
    desc: "Terminal ambre vintage — CRT scanlines, monospace, pour les nostalgiques du SQL brut",
    bg: "#1A1000", panelBg: "#1F1400", text: "#FFB000", sub: "#AA7500",
    border: "#3A2800", accent: "#FFB000", accentText: "#1A1000",
    editorBg: "#1A1000", kwColor: "#FFD866", fnColor: "#FFB000", strColor: "#FFAA44",
    numColor: "#FF8800", lineNumColor: "#5A3A00", editorText: "#FFB000",
    headerBg: "#1F1400", tabActiveBg: "#FFB000", tabActiveText: "#1A1000",
    sidebarBg: "#1A1000", sidebarBorder: "#3A2800",
    cellHover: "#2A1E00", selectedRow: "#3A2800",
    radius: 0, font: "'VT323', monospace", monoFont: "'VT323', monospace",
    layout: "sidebar-left",
    scanlines: true,
  },
  {
    id: "github-light",
    name: "⑤ GitHub Light",
    desc: "Style GitHub — propre, technique, thème de coloration Primer, breadcrumb navigation",
    bg: "#FFFFFF", panelBg: "#FFFFFF", text: "#1F2328", sub: "#656D76",
    border: "#D0D7DE", accent: "#0969DA", accentText: "#fff",
    editorBg: "#F6F8FA", kwColor: "#CF222E", fnColor: "#8250DF", strColor: "#0A3069",
    numColor: "#0550AE", lineNumColor: "#AFB8C1", editorText: "#1F2328",
    headerBg: "#F6F8FA", tabActiveBg: "#FFFFFF", tabActiveText: "#1F2328",
    sidebarBg: "#FFFFFF", sidebarBorder: "#D0D7DE",
    cellHover: "#F6F8FA", selectedRow: "#DDF4FF",
    radius: 6, font: "'Mona Sans', -apple-system, sans-serif", monoFont: "'Fira Code', monospace",
    layout: "sidebar-left",
  },
  {
    id: "linear-split",
    name: "⑥ Linear Split",
    desc: "Split view 50/50 — SQL à gauche, spreadsheet à droite, dark premium style Linear",
    bg: "#0A0A0B", panelBg: "#141415", text: "#EDEDEF", sub: "#7E7E85",
    border: "#232326", accent: "#8B5CF6", accentText: "#fff",
    editorBg: "#0F0F10", kwColor: "#C084FC", fnColor: "#34D399", strColor: "#FCD34D",
    numColor: "#60A5FA", lineNumColor: "#3A3A3D", editorText: "#EDEDEF",
    headerBg: "#141415", tabActiveBg: "#8B5CF6", tabActiveText: "#fff",
    sidebarBg: "#0A0A0B", sidebarBorder: "#232326",
    cellHover: "#1A1A1D", selectedRow: "#2E1065",
    radius: 8, font: "'Geist', sans-serif", monoFont: "'Geist Mono', 'Fira Code', monospace",
    layout: "split-horizontal",
  },
  {
    id: "dracula",
    name: "⑦ Dracula Pro",
    desc: "Palette Dracula — couleurs saturées sur fond sombre, populaire chez les devs",
    bg: "#282A36", panelBg: "#21222C", text: "#F8F8F2", sub: "#6272A4",
    border: "#44475A", accent: "#BD93F9", accentText: "#282A36",
    editorBg: "#282A36", kwColor: "#FF79C6", fnColor: "#50FA7B", strColor: "#F1FA8C",
    numColor: "#BD93F9", lineNumColor: "#44475A", editorText: "#F8F8F2",
    headerBg: "#21222C", tabActiveBg: "#BD93F9", tabActiveText: "#282A36",
    sidebarBg: "#21222C", sidebarBorder: "#44475A",
    cellHover: "#2C2E3A", selectedRow: "#44475A",
    radius: 6, font: "'Fira Sans', sans-serif", monoFont: "'Fira Code', monospace",
    layout: "sidebar-left",
  },
  {
    id: "airtable-fresh",
    name: "⑧ Airtable Fresh",
    desc: "Spreadsheet-first — coloré, tags catégorisés, barre de formule, feeling Airtable/Google Sheets",
    bg: "#FFFFFF", panelBg: "#FFFFFF", text: "#1D1F25", sub: "#6A6F80",
    border: "#E2E5EA", accent: "#166EE1", accentText: "#fff",
    editorBg: "#F5F6F8", kwColor: "#166EE1", fnColor: "#20825C", strColor: "#B35900",
    numColor: "#166EE1", lineNumColor: "#C8CBD0", editorText: "#1D1F25",
    headerBg: "#FFFFFF", tabActiveBg: "#166EE1", tabActiveText: "#fff",
    sidebarBg: "#FFFFFF", sidebarBorder: "#E2E5EA",
    cellHover: "#F0F4FF", selectedRow: "#D3E5FF",
    radius: 6, font: "'Söhne', -apple-system, sans-serif", monoFont: "'SF Mono', 'Fira Code', monospace",
    layout: "spreadsheet-first",
    categoryColors: { "Électronique": "#166EE1", "Textile": "#D33D8C", "Alimentaire": "#20825C", "Services": "#B35900" },
  },
  {
    id: "tokyo-night",
    name: "⑨ Tokyo Night",
    desc: "Palette Tokyo Night — bleu nuit profond, accents chauds, excellent contraste",
    bg: "#1A1B26", panelBg: "#1F2335", text: "#C0CAF5", sub: "#565F89",
    border: "#292E42", accent: "#7AA2F7", accentText: "#1A1B26",
    editorBg: "#1A1B26", kwColor: "#BB9AF7", fnColor: "#7DCFFF", strColor: "#9ECE6A",
    numColor: "#FF9E64", lineNumColor: "#3B4261", editorText: "#C0CAF5",
    headerBg: "#1F2335", tabActiveBg: "#7AA2F7", tabActiveText: "#1A1B26",
    sidebarBg: "#1F2335", sidebarBorder: "#292E42",
    cellHover: "#24283B", selectedRow: "#292E42",
    radius: 8, font: "'IBM Plex Sans', sans-serif", monoFont: "'JetBrains Mono', monospace",
    layout: "sidebar-left",
  },
  {
    id: "paper-ink",
    name: "⑩ Paper & Ink",
    desc: "Style papier imprimé — fond crème, typo serif, bordures fines, pour les rapports et l'analyse",
    bg: "#FAF8F5", panelBg: "#FFFFFF", text: "#2C2C2C", sub: "#8C8C8C",
    border: "#D4D0C8", accent: "#B91C1C", accentText: "#fff",
    editorBg: "#FBF9F6", kwColor: "#B91C1C", fnColor: "#1D4ED8", strColor: "#065F46",
    numColor: "#9333EA", lineNumColor: "#C4C0B8", editorText: "#2C2C2C",
    headerBg: "#F5F3F0", tabActiveBg: "#2C2C2C", tabActiveText: "#FAF8F5",
    sidebarBg: "#FAF8F5", sidebarBorder: "#D4D0C8",
    cellHover: "#F5F3F0", selectedRow: "#FEF2F2",
    radius: 2, font: "'Libre Baskerville', serif", monoFont: "'IBM Plex Mono', monospace",
    layout: "no-sidebar",
  },
];

const fontImports = [
  "DM+Sans:wght@400;500;600;700",
  "Fira+Code:wght@400;500",
  "VT323",
  "Libre+Baskerville:wght@400;700",
  "IBM+Plex+Sans:wght@400;500;600",
  "IBM+Plex+Mono:wght@400;500",
  "JetBrains+Mono:wght@400;500",
  "Fira+Sans:wght@400;500;600",
  "Outfit:wght@400;500;600",
].map(f => `family=${f}`).join("&");

// ─────────────────────────────────────────────
// EXPLORER PREVIEW COMPONENT
// ─────────────────────────────────────────────
const ExplorerPreview = ({ theme: t, isSelected, onClick }) => {
  const [activeTab, setActiveTab] = useState("sql");
  const [showAutocomplete, setShowAutocomplete] = useState(true);

  const containerStyle = {
    background: t.bg,
    borderRadius: t.radius + 4,
    overflow: "hidden",
    fontFamily: t.font,
    color: t.text,
    cursor: "pointer",
    border: isSelected ? `3px solid ${t.accent}` : `3px solid transparent`,
    transition: "all 0.3s ease",
    position: "relative",
    minHeight: 480,
  };

  // Scanlines effect for retro theme
  const scanlinesOverlay = t.scanlines ? (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
      background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`,
      mixBlendMode: "multiply",
    }} />
  ) : null;

  // Tab bar component
  const TabBar = ({ extraLeft, extraRight }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: t.headerBg, borderBottom: `1px solid ${t.border}`,
      padding: "0 12px", height: 38,
    }}>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {extraLeft}
        {[
          { key: "sql", label: "SQL", icon: ">_" },
          { key: "sheet", label: "Spreadsheet", icon: "fx" },
          { key: "both", label: "Both", icon: "⇔" },
        ].map(tab => (
          <button key={tab.key}
            onClick={(e) => { e.stopPropagation(); setActiveTab(tab.key); }}
            style={{
              padding: "5px 12px", fontSize: 11, fontWeight: 500,
              border: "none", cursor: "pointer",
              borderRadius: t.radius / 2,
              fontFamily: t.font,
              background: activeTab === tab.key ? t.tabActiveBg : "transparent",
              color: activeTab === tab.key ? t.tabActiveText : t.sub,
              borderBottom: (t.id === "notion-minimal" || t.id === "paper-ink") && activeTab === tab.key ? `2px solid ${t.accent}` : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ marginRight: 4, opacity: 0.7 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {extraRight}
        <span style={{
          fontSize: 10, padding: "3px 10px", borderRadius: t.radius,
          background: t.accent, color: t.accentText, fontWeight: 600,
          cursor: "pointer",
        }}>▶ Run</span>
      </div>
    </div>
  );

  // Sidebar component
  const Sidebar = () => (
    <div style={{
      width: 180, background: t.sidebarBg,
      borderRight: `1px solid ${t.sidebarBorder}`,
      padding: "10px 0", flexShrink: 0, overflow: "hidden",
    }}>
      <div style={{ padding: "4px 12px 8px", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: t.sub }}>
        Modèles
      </div>
      {sidebarModels.map((m, i) => (
        <div key={i}>
          <div style={{
            padding: "5px 12px", fontSize: 12, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6,
            cursor: "pointer",
          }}>
            <span style={{ fontSize: 11 }}>{m.icon}</span>
            <span>{m.name}</span>
            <span style={{ fontSize: 9, marginLeft: "auto", color: t.sub }}>▾</span>
          </div>
          {i === 0 && m.fields.map((f, fi) => (
            <div key={fi} style={{
              padding: "3px 12px 3px 32px", fontSize: 10, color: t.sub,
              fontFamily: t.monoFont,
            }}>
              {f}
            </div>
          ))}
        </div>
      ))}

      <div style={{ padding: "12px 12px 8px", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: t.sub, borderTop: `1px solid ${t.border}`, marginTop: 8 }}>
        Métriques
      </div>
      {["total_revenue", "nb_orders", "avg_order", "churn_rate"].map((m, i) => (
        <div key={i} style={{
          padding: "3px 12px", fontSize: 11, color: t.accent,
          fontFamily: t.monoFont, fontWeight: 500,
        }}>
          Σ {m}
        </div>
      ))}
    </div>
  );

  // SQL Editor pane
  const SQLPane = ({ height = 180 }) => (
    <div style={{ position: "relative" }}>
      <div style={{
        background: t.editorBg, padding: "10px 14px",
        fontFamily: t.monoFont, fontSize: 11, lineHeight: 1.6,
        color: t.editorText, height, overflow: "hidden",
        borderBottom: `1px solid ${t.border}`,
      }}>
        {colorizeSQL(sqlCode, t)}
      </div>
      {/* Autocomplete popup */}
      {showAutocomplete && activeTab !== "sheet" && (
        <div style={{
          position: "absolute", top: 85, left: 160,
          background: t.panelBg, border: `1px solid ${t.border}`,
          borderRadius: t.radius, boxShadow: `0 8px 24px rgba(0,0,0,0.2)`,
          width: 220, zIndex: 20, overflow: "hidden",
        }}>
          <div style={{ padding: "6px 8px", borderBottom: `1px solid ${t.border}`, fontSize: 9, color: t.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Semantic Autocomplete
          </div>
          {autocompleteItems.map((item, i) => (
            <div key={i} style={{
              padding: "5px 8px", fontSize: 11,
              display: "flex", alignItems: "center", gap: 8,
              background: i === 0 ? t.cellHover : "transparent",
              cursor: "pointer",
            }}>
              <span style={{
                fontSize: 8, padding: "1px 5px", borderRadius: 3,
                fontWeight: 600, textTransform: "uppercase",
                background: item.type === "model" ? `${t.accent}22` : item.type === "metric" ? `${t.fnColor || t.accent}22` : `${t.kwColor}22`,
                color: item.type === "model" ? t.accent : item.type === "metric" ? (t.fnColor || t.accent) : t.kwColor,
              }}>{item.type}</span>
              <span style={{ fontFamily: t.monoFont, fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: 9, color: t.sub, marginLeft: "auto" }}>{item.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Spreadsheet pane
  const SheetPane = ({ maxRows = 8 }) => (
    <div style={{ overflow: "hidden" }}>
      {/* Formula bar for airtable theme */}
      {t.id === "airtable-fresh" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "4px 10px", borderBottom: `1px solid ${t.border}`,
          background: t.editorBg, fontSize: 11,
        }}>
          <span style={{ fontWeight: 600, color: t.accent, fontFamily: t.monoFont }}>fx</span>
          <span style={{ color: t.sub, fontFamily: t.monoFont }}>=SUM(C2:C{maxRows + 1})</span>
        </div>
      )}
      <table style={{
        width: "100%", fontSize: 11, borderCollapse: "collapse",
        fontFamily: t.font,
      }}>
        <thead>
          <tr style={{ background: t.headerBg }}>
            {t.id === "airtable-fresh" && <th style={{ width: 30, padding: "6px 4px", borderBottom: `2px solid ${t.border}`, color: t.sub, fontSize: 10 }}>#</th>}
            {cols.map(c => (
              <th key={c} style={{
                textAlign: "left", padding: "6px 10px",
                borderBottom: `2px solid ${t.border}`,
                fontSize: 10, fontWeight: 600, color: t.sub,
                textTransform: "uppercase", letterSpacing: 0.5,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spreadsheetData.slice(0, maxRows).map((row, ri) => (
            <tr key={ri} style={{
              borderBottom: `1px solid ${t.border}`,
              background: ri === 1 ? t.selectedRow : "transparent",
            }}>
              {t.id === "airtable-fresh" && <td style={{ padding: "5px 4px", color: t.sub, fontSize: 10, textAlign: "center" }}>{ri + 1}</td>}
              <td style={{ padding: "5px 10px", fontFamily: t.monoFont, fontSize: 10 }}>{row.mois}</td>
              <td style={{ padding: "5px 10px" }}>
                {t.categoryColors ? (
                  <span style={{
                    padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 500,
                    background: `${t.categoryColors[row.category] || t.accent}18`,
                    color: t.categoryColors[row.category] || t.accent,
                  }}>{row.category}</span>
                ) : row.category}
              </td>
              <td style={{ padding: "5px 10px", fontWeight: 600, fontFamily: t.monoFont, fontSize: 10 }}>{row.revenue}</td>
              <td style={{ padding: "5px 10px", fontFamily: t.monoFont, fontSize: 10 }}>{row.orders}</td>
              <td style={{ padding: "5px 10px", fontFamily: t.monoFont, fontSize: 10, color: t.sub }}>{row.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        padding: "6px 10px", borderTop: `1px solid ${t.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: t.sub, background: t.headerBg,
      }}>
        <span>{spreadsheetData.length} lignes · 5 colonnes</span>
        <span style={{ fontFamily: t.monoFont }}>Σ revenue = €237 500</span>
      </div>
    </div>
  );

  // LAYOUTS
  const renderLayout = () => {
    if (t.layout === "split-horizontal") {
      // Side by side SQL + Sheet
      return (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${t.border}` }}>
              SQL Editor
            </div>
            <SQLPane height={340} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${t.border}` }}>
              Results
            </div>
            <SheetPane maxRows={7} />
          </div>
        </div>
      );
    }

    if (t.layout === "spreadsheet-first") {
      // Spreadsheet dominant, SQL collapsed at bottom
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <SheetPane maxRows={5} />
          <div style={{
            borderTop: `2px solid ${t.border}`,
            background: t.editorBg,
          }}>
            <div style={{
              padding: "6px 12px", display: "flex", alignItems: "center",
              justifyContent: "space-between", cursor: "pointer",
              borderBottom: `1px solid ${t.border}`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: t.sub, textTransform: "uppercase", letterSpacing: 1 }}>
                SQL généré
              </span>
              <span style={{ fontSize: 9, color: t.sub }}>▾</span>
            </div>
            <div style={{
              fontFamily: t.monoFont, fontSize: 10, padding: "8px 12px",
              color: t.editorText, lineHeight: 1.5, maxHeight: 100, overflow: "hidden",
              opacity: 0.8,
            }}>
              {colorizeSQL(sqlCode.split("\n").slice(0, 5).join("\n"), t)}
            </div>
          </div>
        </div>
      );
    }

    if (t.layout === "no-sidebar") {
      // Clean, no sidebar, command palette style
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Search / command bar */}
          <div style={{
            padding: "8px 16px", borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: t.sub, fontSize: 12 }}>⌘</span>
            <span style={{
              flex: 1, padding: "4px 10px", borderRadius: t.radius,
              border: `1px solid ${t.border}`, fontSize: 11, color: t.sub,
              background: t.editorBg,
            }}>
              Rechercher un modèle, une métrique...
            </span>
          </div>
          {activeTab === "sheet" ? (
            <SheetPane maxRows={7} />
          ) : (
            <>
              <SQLPane height={160} />
              <SheetPane maxRows={4} />
            </>
          )}
        </div>
      );
    }

    // Default: sidebar-left
    return (
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {activeTab === "sheet" ? (
            <SheetPane maxRows={8} />
          ) : activeTab === "both" ? (
            <>
              <SQLPane height={130} />
              <SheetPane maxRows={4} />
            </>
          ) : (
            <>
              <SQLPane height={200} />
              <SheetPane maxRows={3} />
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div onClick={onClick} style={containerStyle}>
      {scanlinesOverlay}
      {/* Top header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px", background: t.headerBg,
        borderBottom: `1px solid ${t.border}`,
        fontSize: 12,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: t.radius / 2,
          background: t.accent, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 800, color: t.accentText,
        }}>D</div>
        <span style={{ fontWeight: 600, fontSize: 12 }}>Orders Overview</span>
        <span style={{ fontSize: 9, color: t.sub, marginLeft: 4 }}>· orders + customers</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: t.radius, border: `1px solid ${t.border}`, color: t.sub }}>↗ Share</span>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: t.radius, border: `1px solid ${t.border}`, color: t.sub }}>⋯</span>
        </div>
      </div>
      {/* Tab bar */}
      <TabBar />
      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 380 }}>
        {renderLayout()}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN GALLERY
// ─────────────────────────────────────────────
export default function ExplorerDesignGallery() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid");

  const selectedTheme = explorerThemes.find(t => t.id === selected);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080C",
      color: "#E4E4E7",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href={`https://fonts.googleapis.com/css2?${fontImports}&display=swap`} rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "40px 40px 0", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #0D9488, #14B8A6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
          }}>D</div>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>DataPilot</span>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20,
            background: "rgba(13,148,136,0.15)", color: "#5EEAD4",
            fontWeight: 500, marginLeft: 4,
          }}>Explorer UI v1</span>
        </div>

        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: -1,
          margin: "20px 0 6px",
          background: "linear-gradient(135deg, #E4E4E7 0%, #A1A1AA 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          10 Propositions d'Interface Explorer
        </h1>
        <p style={{ fontSize: 14, color: "#71717A", maxWidth: 700, lineHeight: 1.6, marginBottom: 6 }}>
          SQL Editor + Spreadsheet — inspiré d'Omni Analytics. Chaque design montre le même workflow :
          sidebar modèles, éditeur SQL avec autocomplete sémantique, résultats en grille.
        </p>
        <p style={{ fontSize: 12, color: "#52525B", marginBottom: 24 }}>
          Cliquez sur un design pour le sélectionner. Utilisez les tabs SQL / Spreadsheet / Both dans chaque preview.
        </p>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[
            { key: "grid", label: "Grille (2×5)" },
            { key: "focus", label: "Vue focus" },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, fontFamily: "inherit",
              background: view === v.key ? "rgba(13,148,136,0.2)" : "rgba(255,255,255,0.05)",
              color: view === v.key ? "#5EEAD4" : "#71717A",
              transition: "all 0.2s ease",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div style={{
          padding: "0 40px 60px", maxWidth: 1500, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
        }}>
          {explorerThemes.map(theme => (
            <div key={theme.id}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#E4E4E7" }}>{theme.name}</div>
                <div style={{ fontSize: 12, color: "#71717A" }}>{theme.desc}</div>
              </div>
              <ExplorerPreview
                theme={theme}
                isSelected={selected === theme.id}
                onClick={() => setSelected(theme.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Focus View */}
      {view === "focus" && (
        <div style={{ padding: "0 40px 60px", maxWidth: 1500, margin: "0 auto" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24,
            padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {explorerThemes.map(t => (
              <button key={t.id} onClick={() => setSelected(t.id)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "inherit",
                background: selected === t.id ? t.accent : "rgba(255,255,255,0.05)",
                color: selected === t.id ? t.accentText : "#71717A",
                transition: "all 0.2s ease",
              }}>{t.name}</button>
            ))}
          </div>

          {selectedTheme ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>
              <ExplorerPreview theme={selectedTheme} isSelected={true} onClick={() => {}} />
              <div style={{ paddingTop: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedTheme.name}</h3>
                <p style={{ fontSize: 13, color: "#71717A", marginBottom: 20, lineHeight: 1.5 }}>{selectedTheme.desc}</p>

                <div style={{ fontSize: 12, marginBottom: 20 }}>
                  <div style={{ color: "#71717A", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Couleurs SQL</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { label: "Keywords", color: selectedTheme.kwColor },
                      { label: "Functions", color: selectedTheme.fnColor },
                      { label: "Strings", color: selectedTheme.strColor },
                      { label: "Numbers", color: selectedTheme.numColor },
                      { label: "Accent", color: selectedTheme.accent },
                    ].map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: c.color, border: "1px solid rgba(255,255,255,0.1)" }} />
                        <span style={{ fontSize: 10, color: "#71717A" }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 12, marginBottom: 20 }}>
                  <div style={{ color: "#71717A", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Typo</div>
                  <div style={{ fontFamily: selectedTheme.font, fontSize: 16, fontWeight: 600, marginBottom: 2 }}>UI: {selectedTheme.font.split("'")[1] || selectedTheme.font}</div>
                  <div style={{ fontFamily: selectedTheme.monoFont, fontSize: 13, color: "#A1A1AA" }}>Code: {selectedTheme.monoFont.split("'")[1] || selectedTheme.monoFont}</div>
                </div>

                <div style={{ fontSize: 12, marginBottom: 20 }}>
                  <div style={{ color: "#71717A", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Layout</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      ["Type", selectedTheme.layout],
                      ["Radius", `${selectedTheme.radius}px`],
                      ["Fond éditeur", selectedTheme.editorBg],
                      ["Sidebar", selectedTheme.layout.includes("sidebar") ? "Oui" : "Non"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#71717A" }}>{k}</span>
                        <span style={{ fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 12 }}>
                  <div style={{ color: "#71717A", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Usage recommandé</div>
                  <p style={{ color: "#A1A1AA", lineHeight: 1.5 }}>
                    {selectedTheme.id === "omni-classic" && "Interface par défaut. Le meilleur compromis lisibilité/fonctionnalité. Convient à tous les profils, du débutant SQL au power user."}
                    {selectedTheme.id === "vscode-dark" && "Les développeurs se sentent immédiatement chez eux. La coloration Monokai et le layout familier réduisent la courbe d'apprentissage à zéro."}
                    {selectedTheme.id === "notion-minimal" && "Pour les utilisateurs qui préfèrent la simplicité. Pas de sidebar distrayante, commande palette pour tout trouver. Idéal pour les analyses ponctuelles."}
                    {selectedTheme.id === "retro-amber" && "Easter egg / mode fun. Le CRT scanlines et la police VT323 créent un attachement émotionnel fort. Réservé aux nostalgiques."}
                    {selectedTheme.id === "github-light" && "Familier pour les équipes tech utilisant GitHub. Le thème Primer est éprouvé et la navigation breadcrumb aide l'orientation."}
                    {selectedTheme.id === "linear-split" && "Vue split 50/50 permanente pour voir SQL et résultats simultanément. Parfait pour l'itération rapide et le debug de requêtes complexes."}
                    {selectedTheme.id === "dracula" && "Thème populaire auprès des devs. Les couleurs saturées facilitent la lecture du code. Excellent pour les sessions longues d'exploration."}
                    {selectedTheme.id === "airtable-fresh" && "Spreadsheet-first : les utilisateurs non-SQL se sentent chez eux. La barre de formule et les tags colorés rappellent Airtable/Google Sheets. Idéal pour les PME cibles."}
                    {selectedTheme.id === "tokyo-night" && "Palette de couleurs éprouvée dans l'écosystème dev. Le bleu nuit profond réduit la fatigue oculaire, les accents chauds guident l'œil."}
                    {selectedTheme.id === "paper-ink" && "Pour les analystes qui rédigent des rapports. La typo serif et le fond crème donnent un ton éditorial. Le SQL devient presque de la prose."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 400, color: "#52525B", fontSize: 14,
              border: "1px dashed #27272A", borderRadius: 12,
            }}>
              ← Sélectionnez un thème pour voir le détail
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "20px 40px", borderTop: "1px solid rgba(255,255,255,0.05)",
        textAlign: "center", color: "#52525B", fontSize: 11,
      }}>
        DataPilot Explorer UI — 10 interfaces proposées pour la Phase 1 SQL + Spreadsheet
      </div>
    </div>
  );
}