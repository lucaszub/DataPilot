"use client";

import { useState } from "react";
import HeroVariant1 from "@/components/landing/HeroVariant1";
import HeroVariant2 from "@/components/landing/HeroVariant2";
import HeroVariant3 from "@/components/landing/HeroVariant3";
import HeroVariant4 from "@/components/landing/HeroVariant4";
import HeroVariant5 from "@/components/landing/HeroVariant5";
import { Features } from "@/components/landing/Features";

const variants = [
  { id: 1, name: "Indigo Corporate", color: "bg-indigo-600", component: HeroVariant1 },
  { id: 2, name: "Emerald Fresh", color: "bg-emerald-500", component: HeroVariant2 },
  { id: 3, name: "Violet Aurora", color: "bg-violet-600", component: HeroVariant3 },
  { id: 4, name: "Amber Warm", color: "bg-amber-500", component: HeroVariant4 },
  { id: 5, name: "Rose Canvas", color: "bg-rose-500", component: HeroVariant5 },
] as const;

export default function LandingPage() {
  const [activeVariant, setActiveVariant] = useState(1);

  const current = variants.find((v) => v.id === activeVariant)!;
  const HeroComponent = current.component;

  return (
    <div className="relative">
      <HeroComponent />
      <Features variant={activeVariant as 1 | 2 | 3 | 4 | 5} />

      {/* Variant Switcher - Fixed bottom bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl border border-gray-200 dark:border-zinc-700 px-4 py-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 hidden sm:block">
            Variante:
          </span>
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVariant(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeVariant === v.id
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${v.color}`} />
              <span className="hidden md:inline">{v.name}</span>
              <span className="md:hidden">{v.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
