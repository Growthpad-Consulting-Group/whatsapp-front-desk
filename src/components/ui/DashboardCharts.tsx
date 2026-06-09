"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

interface WeeklyBookingData {
  labels: string[];
  confirmed: number[];
  cancelled: number[];
}

interface RevenueData {
  labels: string[];
  revenue: number[];
}

interface DashboardChartsProps {
  weeklyBookings: WeeklyBookingData;
  revenueData: RevenueData;
  currency: string;
}

export function DashboardCharts({ weeklyBookings, revenueData, currency }: DashboardChartsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, font: { family: "var(--font-nunito)", size: 11 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: isDark ? "#f9fafb" : "#111827",
        bodyColor: isDark ? "#9ca3af" : "#6b7280",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: "var(--font-nunito)", size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: "var(--font-nunito)", size: 11 }, precision: 0 },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: isDark ? "#f9fafb" : "#111827",
        bodyColor: isDark ? "#9ca3af" : "#6b7280",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => ` ${currency} ${Number(ctx.raw).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: "var(--font-nunito)", size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: "var(--font-nunito)", size: 11 },
          callback: (v) => `${currency} ${Number(v).toLocaleString()}`,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  const barData = {
    labels: weeklyBookings.labels,
    datasets: [
      {
        label: "Confirmed",
        data: weeklyBookings.confirmed,
        backgroundColor: "rgba(37,99,235,0.75)",
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Cancelled",
        data: weeklyBookings.cancelled,
        backgroundColor: isDark ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.25)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const lineData = {
    labels: revenueData.labels,
    datasets: [
      {
        label: "Revenue",
        data: revenueData.revenue,
        borderColor: "rgb(37,99,235)",
        backgroundColor: isDark ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "rgb(37,99,235)",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue trend */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Last 8 weeks</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
        </div>
        <div className="h-52">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Weekly bookings */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">Weekly Bookings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">This week by day</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>
        <div className="h-52">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
