"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { TrendingUp, Users, DollarSign } from "lucide-react";

export default function HeroVariant3() {
  return (
    <AuroraBackground>
      <div className="relative z-10 min-h-screen">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-violet-600">DataPilot</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-700">
              Connexion
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700">Démarrer gratuitement</Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  L'IA qui comprend
                </span>{" "}
                <span className="text-gray-900">vos données</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Plus besoin de maîtriser SQL. Parlez à vos données en français et obtenez des
                réponses instantanées.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">
                  Démarrer
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-white/80 backdrop-blur border-violet-600 text-violet-600 hover:bg-white"
                >
                  En savoir plus
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Animated stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Card 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-violet-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Croissance mensuelle</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-3xl font-bold text-gray-900"
                  >
                    <CountUp end={47} />%
                  </motion.div>
                  <div className="text-xs text-green-600 mt-1">+12% vs mois dernier</div>
                </motion.div>

                {/* Card 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-violet-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Utilisateurs actifs</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-3xl font-bold text-gray-900"
                  >
                    <CountUp end={2847} />
                  </motion.div>
                  <div className="text-xs text-green-600 mt-1">+324 cette semaine</div>
                </motion.div>

                {/* Card 3 - Spans 2 columns */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="col-span-2 bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Revenus ce mois</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-3xl font-bold"
                      >
                        €<CountUp end={156} />K
                      </motion.div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                    <div>
                      <div className="text-xs opacity-75">Objectif</div>
                      <div className="text-sm font-semibold">€180K</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75">Progression</div>
                      <div className="text-sm font-semibold">86.7%</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75">Reste</div>
                      <div className="text-sm font-semibold">€24K</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}

function CountUp({ end }: { end: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end]);

  return <>{count.toLocaleString()}</>;
}

import * as React from "react";

export { HeroVariant3 };
