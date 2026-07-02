import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Building, 
  TrendingUp, 
  AlertTriangle, 
  ListTodo, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { Lease, Payment, Compliance } from '../types';

interface AIInsightsPanelProps {
  leases: Lease[];
  payments: Payment[];
  compliance: Compliance[];
}

export default function AIInsightsPanel({ leases, payments, compliance }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPortfolioInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/portfolio-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leases, payments, compliance })
      });
      const data = await response.json();
      if (data.insights) {
        setInsights(data.insights);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setInsights("Failed to fetch custom strategic insights. Ensure model configuration is valid.");
      }
    } catch (err) {
      console.error(err);
      setInsights("Connection failed. Running in static analysis fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioInsights();
  }, [leases.length, payments.length, compliance.length]);

  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-6 shadow-xs space-y-6" id="ai-insights-panel">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
        <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Asisten AI Strategi Portofolio
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Audit portofolio real-time yang menggabungkan data kontrak, laporan kepatuhan, dan pencatatan sewa untuk menghasilkan ringkasan eksekutif.
          </p>
        </div>

        <button
          id="btn-refresh-insights"
          disabled={loading}
          onClick={fetchPortfolioInsights}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-black dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {loading ? "Menganalisis..." : "Hitung Ulang Analisis"}
        </button>
      </div>

      {/* Main Insights Content */}
      {loading ? (
        <div className="py-20 text-center space-y-4" id="insights-loader">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Menganalisis register bangunan...</p>
            <p className="text-xs text-gray-500">Menyelaraskan catatan pembayaran, kedaluwarsa kontrak, dan peringatan kepatuhan aktif...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Markdown Output */}
          <div className="lg:col-span-3 space-y-4">
            {insights ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm font-sans"
                id="advisor-markdown"
              >
                {insights}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                Gagal memuat saran asisten AI. Silakan klik hitung ulang.
              </div>
            )}
            
            {lastUpdated && (
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-4">
                <Clock className="w-3 h-3" />
                Ringkasan strategi diperbarui pada {lastUpdated}
              </p>
            )}
          </div>

          {/* Quick Metrics / Sidebar */}
          <div className="lg:col-span-1 bg-gray-50/50 dark:bg-black/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 space-y-4" id="insights-metrics-panel">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Statistik Portofolio</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Kontrak Aktif</span>
                </div>
                <span className="font-bold text-xs text-gray-900 dark:text-white">{leases.filter(l => l.status === 'active').length}</span>
              </div>

              <div className="p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Tunggakan Sewa</span>
                </div>
                <span className="font-bold text-xs text-rose-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                    payments.filter(p => p.status === 'overdue' || p.status === 'partial').reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Kasus Terbuka</span>
                </div>
                <span className="font-bold text-xs text-amber-600">{compliance.filter(c => c.status !== 'resolved').length}</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-400 rounded-xl text-[11px] leading-relaxed">
              💡 <strong>Sistem Otomatis:</strong> Diperbarui langsung saat pembayaran dicatat atau laporan ketertiban baru diajukan oleh tim keamanan gedung.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
