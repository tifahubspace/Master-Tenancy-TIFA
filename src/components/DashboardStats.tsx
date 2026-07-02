import React from 'react';
import { 
  Building2, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  Users
} from 'lucide-react';
import { PortfolioStats } from '../types';

interface DashboardStatsProps {
  stats: PortfolioStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const cards = [
    {
      id: "stat-leases",
      title: "Kontrak Aktif",
      value: `${stats.activeLeases} / ${stats.totalLeases}`,
      description: "Okupansi & kontrak aktif saat ini",
      icon: FileText,
      bgColor: "bg-blue-50/70 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-100 dark:border-blue-900/50"
    },
    {
      id: "stat-revenue",
      title: "Pendapatan Diterima",
      value: formatCurrency(stats.totalRentCollected),
      description: `Target: ${formatCurrency(stats.totalRentReceivable)} piutang`,
      icon: DollarSign,
      bgColor: "bg-emerald-50/70 dark:bg-emerald-950/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-100 dark:border-emerald-900/50"
    },
    {
      id: "stat-outstanding",
      title: "Sewa Belum Dibayar",
      value: formatCurrency(stats.totalRentOutstanding),
      description: `${Math.round((stats.totalRentCollected / (stats.totalRentReceivable || 1)) * 100)}% tingkat penagihan`,
      icon: TrendingUp,
      bgColor: stats.totalRentOutstanding > 0 ? "bg-amber-50/70 dark:bg-amber-950/20" : "bg-teal-50/70 dark:bg-teal-950/20",
      iconColor: stats.totalRentOutstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400",
      borderColor: stats.totalRentOutstanding > 0 ? "border-amber-100 dark:border-amber-900/50" : "border-teal-100 dark:border-teal-900/50"
    },
    {
      id: "stat-compliance",
      title: "Tingkat Kepatuhan",
      value: `${stats.complianceRate}%`,
      description: `${stats.activeComplianceCases} insiden aktif`,
      icon: AlertTriangle,
      bgColor: stats.complianceRate < 80 ? "bg-red-50/70 dark:bg-red-950/20" : "bg-indigo-50/70 dark:bg-indigo-950/20",
      iconColor: stats.complianceRate < 80 ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400",
      borderColor: stats.complianceRate < 80 ? "border-red-100 dark:border-red-900/50" : "border-indigo-100 dark:border-indigo-900/50"
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
            className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">
                {card.title}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {card.value}
                </div>
                <div className={`p-1 rounded ${card.bgColor} ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center mt-3 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${card.iconColor} bg-current`}></span>
              {card.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
