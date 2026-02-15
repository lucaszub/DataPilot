"use client";

import { motion } from "framer-motion";
import { Upload, MessageSquare, LayoutDashboard, GitBranch, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturesProps {
  variant: 1 | 2 | 3 | 4 | 5;
}

const variantColors = {
  1: "indigo-600",
  2: "emerald-500",
  3: "violet-600",
  4: "amber-500",
  5: "rose-500",
};

const features = [
  {
    icon: Upload,
    title: "Import CSV en un clic",
    description: "Glissez-déposez vos fichiers CSV, analyse automatique des colonnes et types.",
  },
  {
    icon: MessageSquare,
    title: "Interrogez en français",
    description: "Posez vos questions en langage naturel, l'IA génère le SQL pour vous.",
  },
  {
    icon: LayoutDashboard,
    title: "Tableaux de bord interactifs",
    description: "Créez des dashboards drag-and-drop avec graphiques KPI, barres, lignes, camemberts.",
  },
  {
    icon: GitBranch,
    title: "Modélisation sémantique",
    description: "Définissez les relations entre vos données pour des analyses croisées intelligentes.",
  },
  {
    icon: Shield,
    title: "Hébergement souverain",
    description: "Vos données restent en France sur infrastructure OVH. Multi-tenant isolé.",
  },
  {
    icon: Zap,
    title: "Résultats instantanés",
    description: "Moteur DuckDB in-process pour des requêtes ultra-rapides sur vos CSV.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Features({ variant }: FeaturesProps) {
  const color = variantColors[variant];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour vos analyses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            DataPilot combine IA conversationnelle et outils de visualisation pour une BI accessible à tous.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                  variant === 1 && "bg-indigo-100 text-indigo-600",
                  variant === 2 && "bg-emerald-100 text-emerald-500",
                  variant === 3 && "bg-violet-100 text-violet-600",
                  variant === 4 && "bg-amber-100 text-amber-500",
                  variant === 5 && "bg-rose-100 text-rose-500"
                )}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export { Features };
