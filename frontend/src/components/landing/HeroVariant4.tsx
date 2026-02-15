"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, MessageCircle, BarChart3 } from "lucide-react";

export default function HeroVariant4() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
      {/* Dotted grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #d97706 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-amber-600">DataPilot</div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-700">
            Connexion
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold">
            Demarrer gratuitement
          </Button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              La BI enfin accessible aux{" "}
              <span className="text-amber-600">PME</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Fini les outils BI complexes et hors de prix. DataPilot democratise l&apos;analyse de
              donnees pour les entreprises francaises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold text-lg px-8">
                Creer mon compte
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-amber-500 text-amber-600 hover:bg-amber-100"
              >
                Voir les tarifs
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Flow diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[500px] hidden lg:block"
          >
            {/* Card 1 - CSV */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 bg-white rounded-2xl shadow-xl p-8 w-64 border-2 border-amber-200"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Importez</h3>
              <p className="text-sm text-gray-600">Glissez-deposez vos fichiers CSV</p>
            </motion.div>

            {/* Card 2 - Question */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-20 right-0 bg-white rounded-2xl shadow-xl p-8 w-64 border-2 border-amber-200"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Interrogez</h3>
              <p className="text-sm text-gray-600">Posez vos questions en francais</p>
            </motion.div>

            {/* Card 3 - Chart */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 w-64 text-white border-2 border-amber-300"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">3. Visualisez</h3>
              <p className="text-sm opacity-90">Obtenez vos insights instantanement</p>
            </motion.div>

            {/* Connecting dashed lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
              <motion.path
                d="M 180 80 Q 240 100 280 120"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="8 8"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
              />
              <motion.path
                d="M 380 180 Q 340 280 260 360"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="8 8"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 1 }}
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { HeroVariant4 };
