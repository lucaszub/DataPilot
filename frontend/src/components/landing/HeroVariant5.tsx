"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { renderCanvas } from "@/components/ui/canvas";

export default function HeroVariant5() {
  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Canvas background */}
      <canvas
        id="canvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Rose tint overlay */}
      <div className="absolute inset-0 bg-rose-50/30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold" style={{ color: "#ff4d88" }}>
          DataPilot
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-700">
            Connexion
          </Button>
          <Button className="hover:opacity-90" style={{ backgroundColor: "#ff4d88" }}>
            Démarrer gratuitement
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
              DataPilot — Votre{" "}
              <span style={{ color: "#ff4d88" }}>copilote data</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              La plateforme BI française qui transforme vos CSV en tableaux de bord intelligents.
              Propulsée par l'IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 hover:opacity-90"
                style={{ backgroundColor: "#ff4d88" }}
              >
                Commencer
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 hover:bg-rose-50"
                style={{ borderColor: "#ff4d88", color: "#ff4d88" }}
              >
                Découvrir
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Explorer mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-sm font-medium text-gray-700">Explorer SQL</div>
                <div className="w-20" />
              </div>

              {/* SQL Query */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-6 py-4 bg-gray-900 font-mono text-sm"
              >
                <div className="text-gray-500 mb-2">-- Query généré par l'IA</div>
                <div className="text-gray-300">
                  <span className="text-purple-400">SELECT</span>{" "}
                  <span className="text-blue-400">region</span>,
                </div>
                <div className="text-gray-300 pl-7">
                  <span className="text-yellow-400">SUM</span>(
                  <span className="text-blue-400">revenue</span>) <span className="text-purple-400">as</span>{" "}
                  <span className="text-blue-400">total</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-purple-400">FROM</span>{" "}
                  <span className="text-green-400">sales</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-purple-400">GROUP BY</span>{" "}
                  <span className="text-blue-400">region</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-purple-400">ORDER BY</span>{" "}
                  <span className="text-blue-400">total</span>{" "}
                  <span className="text-purple-400">DESC</span>
                </div>
              </motion.div>

              {/* Results Table */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-6"
              >
                <div className="text-xs font-medium text-gray-500 mb-3 flex items-center justify-between">
                  <span>RÉSULTATS (3 lignes)</span>
                  <span className="text-green-600">✓ Exécuté en 24ms</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
                    <div>region</div>
                    <div className="text-right">total</div>
                  </div>
                  {/* Table Rows */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-100 text-sm"
                  >
                    <div className="text-gray-900">Île-de-France</div>
                    <div className="text-right font-semibold" style={{ color: "#ff4d88" }}>
                      €485,200
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-100 text-sm"
                  >
                    <div className="text-gray-900">Auvergne-Rhône-Alpes</div>
                    <div className="text-right font-semibold" style={{ color: "#ff4d88" }}>
                      €312,800
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="grid grid-cols-2 gap-4 px-4 py-3 text-sm"
                  >
                    <div className="text-gray-900">Nouvelle-Aquitaine</div>
                    <div className="text-right font-semibold" style={{ color: "#ff4d88" }}>
                      €267,400
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { HeroVariant5 };
