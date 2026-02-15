"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  BarChart3,
  Code,
  LayoutDashboard,
  GitMerge,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orders, customers, orderItems } from "@/lib/mock-data";

// Compute KPIs from mock data
const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
const totalOrders = orders.length;
const activeCustomers = new Set(orders.map((o) => o.customer_id)).size;
const avgBasket = totalRevenue / totalOrders;

// Recent orders for activity feed
const recentOrders = [...orders]
  .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
  .slice(0, 8);

// Previous period comparison (mock: -5% to +15% range)
const revenueTrend = 12.4;
const ordersTrend = 8.7;
const customersTrend = -2.1;

const kpis = [
  {
    label: "Chiffre d'affaires",
    value: totalRevenue,
    format: "currency",
    trend: revenueTrend,
    icon: DollarSign,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    label: "Commandes",
    value: totalOrders,
    format: "number",
    trend: ordersTrend,
    icon: ShoppingCart,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  },
  {
    label: "Clients actifs",
    value: activeCustomers,
    format: "number",
    trend: customersTrend,
    icon: Users,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
  },
  {
    label: "Panier moyen",
    value: avgBasket,
    format: "currency",
    trend: 5.3,
    icon: BarChart3,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  },
];

const quickLinks = [
  {
    title: "Explorer les donnees",
    description: "Interrogez vos donnees avec le query builder visuel",
    href: "/explorer",
    icon: Code,
  },
  {
    title: "Tableaux de bord",
    description: "Visualisez vos KPIs et metriques cles",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Modele de donnees",
    description: "Gerez les relations entre vos tables",
    href: "/model",
    icon: GitMerge,
  },
];

function formatValue(value: number, format: string): string {
  if (format === "currency") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function HomePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue sur DataPilot
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d&apos;ensemble de vos donnees commerciales
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                {kpi.label}
              </span>
              <div className={cn("p-2 rounded-lg", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatValue(kpi.value, kpi.format)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.trend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    kpi.trend > 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {kpi.trend > 0 ? "+" : ""}
                  {kpi.trend}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs mois precedent
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Acces rapide
          </h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {link.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Activite recente
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const customer = customers.find(
                  (c) => c.id === order.customer_id
                );
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-muted">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{order.id}</span>
                        {" — "}
                        <span className="text-muted-foreground">
                          {customer?.company ?? "Client inconnu"}
                        </span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        order.status === "completed" &&
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                        order.status === "pending" &&
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
                        order.status === "shipped" &&
                          "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
                        order.status === "cancelled" &&
                          "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                      )}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(order.total_amount)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.order_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
