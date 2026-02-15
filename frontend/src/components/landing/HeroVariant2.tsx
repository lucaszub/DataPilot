"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Database, BarChart } from "lucide-react";

export default function HeroVariant2() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Organic blob shapes */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-emerald-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-300 rounded-full blur-3xl opacity-10 rotate-45" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-emerald-500">DataPilot</div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-700">
            Connexion
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600">Démarrer gratuitement</Button>
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
              Vos données parlent.{" "}
              <span className="text-emerald-500">Écoutez-les.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Importez vos CSV, posez vos questions en français. DataPilot transforme vos fichiers
              en décisions éclairées.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-lg px-8">
                Essayer maintenant
              </Button>
              <Button size="lg" variant="ghost" className="text-lg px-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                Découvrir les fonctionnalités <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Terminal-like conversation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-800">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 text-sm font-medium text-gray-400">DataPilot Query</div>
              </div>

              {/* Conversation */}
              <div className="space-y-4 font-mono text-sm">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-emerald-400 mb-1">Vous:</div>
                    <div className="text-gray-300">
                      Quel est le chiffre d'affaires par région ?
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start gap-3"
                >
                  <Database className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-blue-400 mb-1">SQL généré:</div>
                    <div className="bg-gray-800 rounded p-3 text-gray-300 text-xs">
                      SELECT region, SUM(revenue) as total<br />
                      FROM sales<br />
                      GROUP BY region<br />
                      ORDER BY total DESC
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-start gap-3"
                >
                  <BarChart className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-purple-400 mb-2">Résultats:</div>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-300 text-xs">
                          <span>Île-de-France</span>
                          <span className="text-emerald-400">€485,200</span>
                        </div>
                        <div className="flex justify-between text-gray-300 text-xs">
                          <span>Auvergne-Rhône-Alpes</span>
                          <span className="text-emerald-400">€312,800</span>
                        </div>
                        <div className="flex justify-between text-gray-300 text-xs">
                          <span>Nouvelle-Aquitaine</span>
                          <span className="text-emerald-400">€267,400</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="flex items-center gap-2 text-gray-500 text-xs"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Prêt pour une nouvelle question...
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { HeroVariant2 };
