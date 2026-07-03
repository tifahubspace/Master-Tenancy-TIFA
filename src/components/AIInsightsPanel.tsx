import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Building, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';
import { Lease, Payment, Building as BuildingType } from '../types';

interface AIInsightsPanelProps {
  leases: Lease[];
  payments: Payment[];
  buildings: BuildingType[];
}

export default function AIInsightsPanel({ leases, payments, buildings }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPortfolioInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/portfolio-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leases, payments, buildings })
      });
      const data = await response.json();
      setInsights(data.insights || "Gagal mendapatkan draf analisis strategis.");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setInsights("Koneksi gagal. Layanan Gemini AI tidak terjangkau saat ini.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioInsights();
  }, [leases.length, payments.length, buildings.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6" id="ai-insights-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-base font-sans font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            Strategic Portfolio AI Briefing
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Menganalisis performa keuangan, rasio okupansi gedung, dan kepatuhan hukum draf sewa komersial secara komprehensif.
          </p>
        </div>

        <button
          id="btn-refresh-insights"
          disabled={loading}
          onClick={fetchPortfolioInsights}
          className="bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800 hover:border-cyan-600 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {loading ? "Menganalisis..." : "Hitung Ulang"}
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="font-sans text-xs text-slate-400 font-semibold">Sedang menganalisis draf sewa & kepatuhan pembayaran...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {insights ? (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-wrap max-h-[500px] overflow-y-auto scrollbar-thin">
                {insights}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs font-sans">
                Belum ada analisis terkumpul.
              </div>
            )}
            
            {lastUpdated && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-4 font-mono">
                <Clock className="w-3 h-3" />
                Draf analisis diperbarui pada {lastUpdated}
              </p>
            )}
          </div>

          <div className="lg:col-span-1 bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4" id="insights-metrics-panel">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Ringkasan Portofolio</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-300 font-sans">Total Gedung</span>
                </div>
                <span className="font-bold text-xs text-white">{buildings.length}</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-sans">Kontrak Sewa</span>
                </div>
                <span className="font-bold text-xs text-white">{leases.length}</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-slate-300 font-sans">Tunggakan</span>
                </div>
                <span className="font-bold text-xs text-rose-400">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                    payments.filter(p => p.status === 'overdue' || p.status === 'partial').reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/40 text-cyan-400 rounded-lg text-[11px] leading-relaxed font-sans">
              💡 <strong>Model Gemini AI:</strong> Ringkasan ini diproduksi langsung menggunakan kecerdasan buatan dari data real-time di database.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
