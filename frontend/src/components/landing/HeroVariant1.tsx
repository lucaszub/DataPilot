"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users } from "lucide-react";

export default function HeroVariant1() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-400 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-indigo-600">DataPilot</div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-700">
            Connexion
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Démarrer gratuitement</Button>
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
              Transformez vos CSV en{" "}
              <span className="text-indigo-600">insights</span> en 30 secondes
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              La BI conversationnelle pour les PME françaises. Importez, interrogez en français,
              visualisez. Sans compétence technique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8">
                Commencer gratuitement
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                Voir la démo
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              {/* Fake Dashboard Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 text-sm font-medium text-gray-700">Dashboard Overview</div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-indigo-50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">€245K</div>
                  <div className="text-xs text-green-600">+12.5%</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-indigo-50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <div className="text-xs text-gray-600">Clients</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">1,248</div>
                  <div className="text-xs text-green-600">+8.3%</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-indigo-50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <div className="text-xs text-gray-600">Conversion</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">24.8%</div>
                  <div className="text-xs text-green-600">+3.2%</div>
                </motion.div>
              </div>

              {/* Fake Bar Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="text-sm font-medium text-gray-700 mb-4">Ventes par région</div>
                <div className="flex items-end justify-between h-32 gap-2">
                  {[65, 85, 72, 90, 78, 68, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                      className="flex-1 bg-indigo-600 rounded-t"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { HeroVariant1 };
