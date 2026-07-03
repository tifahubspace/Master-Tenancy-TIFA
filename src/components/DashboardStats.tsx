import React from 'react';
import { 
  Building2, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Users,
  Grid
} from 'lucide-react';
import { PortfolioStats } from '../types';

interface DashboardStatsProps {
  stats: PortfolioStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const cards = [
    {
      id: "stat-occupancy",
      title: "Rasio Okupansi Gedung",
      value: `${stats.occupancyRate}%`,
      description: `${stats.occupiedUnits} unit terisi dari total ${stats.totalUnits} unit`,
      icon: Grid,
      bgColor: "bg-cyan-950/40 text-cyan-400 border border-cyan-900/60"
    },
    {
      id: "stat-leases",
      title: "Kontrak Aktif",
      value: `${stats.activeLeases} / ${stats.totalLeases}`,
      description: "Draf sewa komersial terdaftar",
      icon: FileText,
      bgColor: "bg-blue-950/40 text-blue-400 border border-blue-900/60"
    },
    {
      id: "stat-revenue",
      title: "Kas Masuk Realisasi",
      value: formatCurrency(stats.revenueCollected),
      description: `Target Estimasi: ${formatCurrency(stats.monthlyRevenueEstimate)}`,
      icon: DollarSign,
      bgColor: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/60"
    },
    {
      id: "stat-outstanding",
      title: "Sisa Tagihan Tunggakan",
      value: formatCurrency(stats.revenueOutstanding),
      description: `Tunggakan sewa yang harus ditagih`,
      icon: TrendingUp,
      bgColor: stats.revenueOutstanding > 0 
        ? "bg-rose-950/40 text-rose-400 border border-rose-900/60" 
        : "bg-teal-950/40 text-teal-400 border border-teal-900/60"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.id} 
            id={card.id}
            className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-sans mb-1">
                {card.title}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl font-bold font-sans text-white">
                  {card.value}
                </div>
                <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center mt-3.5 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-cyan-400 inline-block"></span>
              {card.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
