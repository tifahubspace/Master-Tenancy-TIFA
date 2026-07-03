import React, { useState } from "react";
import { ArrowLeftRight, FileText, Sparkles, RefreshCw, AlertTriangle, Check, ShieldAlert } from "lucide-react";

const COMPARISON_TEMPLATES = [
  {
    title: "Revisi Sewa PT Medidata Indonesia (TIFA Suite 201)",
    original: "HARGA SEWA & SECURITY DEPOSIT:\nSewa bulanan disepakati sebesar Rp 60.000.000 (enam puluh juta Rupiah) per bulan.\nSecurity Deposit wajib diserahkan senilai Rp 120.000.000 (setara dua bulan sewa).\n\nPEMELIHARAAN AC & FASILITAS:\nPemeliharaan rutin unit AC sepenuhnya menjadi tanggung jawab dan beban Pengelola Gedung.",
    revised: "HARGA SEWA & SECURITY DEPOSIT:\nSewa bulanan mengalami penyesuaian menjadi sebesar Rp 65.000.000 (enam puluh lima juta Rupiah) per bulan.\nSecurity Deposit disesuaikan menjadi senilai Rp 130.000.000.\n\nPEMELIHARAAN AC & FASILITAS:\nPemeliharaan rutin unit AC ditanggung bersama. Tenant menanggung biaya perbaikan minor hingga maksimal Rp 2.500.000 per unit, selebihnya ditanggung Pengelola Gedung."
  },
  {
    title: "Revisi Opsi Grace Period & Denda Astra Logistics (Ventura)",
    original: "SANKSI KETERLAMBATAN PEMBAYARAN:\nSewa bulanan wajib diserahkan selambat-lambatnya tanggal 15 setiap bulannya. Keterlambatan pembayaran dikenakan denda sebesar 1% per hari dari nilai tagihan sekeluarga.",
    revised: "SANKSI KETERLAMBATAN PEMBAYARAN:\nSewa bulanan wajib diserahkan selambat-lambatnya tanggal 15 setiap bulannya. Diberikan masa toleransi (Grace Period) tanpa denda hingga tanggal 20 setiap bulannya. Setelah itu, keterlambatan dikenakan denda akumulatif sebesar 0.5% per hari."
  }
];

export default function AIContractComparison() {
  const [contractA, setContractA] = useState("");
  const [contractB, setContractB] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleRunComparison = async (textA?: string, textB?: string) => {
    const finalA = textA || contractA;
    const finalB = textB || contractB;

    if (!finalA.trim() || !finalB.trim()) {
      alert("Mohon masukkan teks atau klausul kontrak pada kedua sisi.");
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const response = await fetch("/api/gemini/compare-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractA: finalA,
          contractB: finalB
        })
      });

      if (!response.ok) {
        throw new Error("Gagal membandingkan draf kontrak.");
      }

      const result = await response.json();
      setReport(result.comparison);
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (idx: number) => {
    const temp = COMPARISON_TEMPLATES[idx];
    setContractA(temp.original);
    setContractB(temp.revised);
    handleRunComparison(temp.original, temp.revised);
  };

  const renderComparisonReport = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="font-sans font-bold text-sm text-slate-100 mt-4 mb-2">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="font-sans font-semibold text-xs text-cyan-300 mt-3 mb-1 uppercase tracking-wider">{line.replace("#### ", "")}</h5>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="font-sans font-bold text-base text-cyan-400 mt-4 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const clean = line.trim().replace(/^[\*\-]\s+/, "");
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-slate-300 font-sans text-xs">
            <li>{parseComparisonHighlights(clean)}</li>
          </ul>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2"></div>;
      }
      return <p key={idx} className="my-1 text-slate-300 font-sans text-xs leading-relaxed">{parseComparisonHighlights(line)}</p>;
    });
  };

  const parseComparisonHighlights = (str: string) => {
    // Look for bold highlights, risk ratings, and custom colors
    const parts = str.split(/(\*\*.*?\*\*|🟡|🟢|🔴|High Risk|Medium Risk|Low Risk)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part === "High Risk" || part === "🔴") {
        return <span key={i} className="text-rose-400 font-semibold">{part}</span>;
      }
      if (part === "Medium Risk" || part === "🟡") {
        return <span key={i} className="text-amber-400 font-semibold">{part}</span>;
      }
      if (part === "Low Risk" || part === "🟢") {
        return <span key={i} className="text-emerald-400 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400 animate-pulse" />
            AI Contract Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Periksa amandemen atau klausul kontrak yang direvisi secara instan. AI akan mendeteksi pergeseran nominal sewa, penyesuaian deposit, perubahan klausul beban pemeliharaan, serta memberikan rating tingkat risiko operasional hukum.
          </p>
        </div>
      </div>

      {/* Quick Sandboxes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-sans">
          ⚡ Pilih Skenario Perbandingan Cepat (Sandbox):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPARISON_TEMPLATES.map((temp, i) => (
            <button
              key={i}
              id={`btn-compare-scenario-${i}`}
              onClick={() => handleLoadTemplate(i)}
              className="text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-3 rounded-lg font-sans text-xs transition duration-150 flex flex-col justify-between group"
            >
              <span className="font-bold text-cyan-400 group-hover:text-white transition-colors">{temp.title}</span>
              <span className="text-[10px] text-slate-500 mt-1 truncate">Bandingkan harga sewa, deposit, serta hak & kewajiban...</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dual Textboxes Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
              Klausul Kontrak Sisi-Demi-Sisi
            </h3>
            <button
              id="btn-run-manual-compare"
              onClick={() => handleRunComparison()}
              disabled={loading || !contractA.trim() || !contractB.trim()}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-sans text-xs font-bold py-1.5 px-4 rounded-md flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3..5 h-3.5 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Bandingkan Kontrak
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Kontrak A (Original / Versi Asli)
              </label>
              <textarea
                id="textarea-compare-a"
                rows={10}
                placeholder="Tempel atau ketik draf sewa versi asli di sini..."
                value={contractA}
                onChange={(e) => setContractA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-300 rounded-lg p-3.5 text-xs font-mono outline-hidden resize-none leading-relaxed h-80 scrollbar-thin"
              />
            </div>

            {/* Revised Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Kontrak B (Revised / Versi Amandemen)
              </label>
              <textarea
                id="textarea-compare-b"
                rows={10}
                placeholder="Tempel atau ketik draf sewa versi revisi di sini..."
                value={contractB}
                onChange={(e) => setContractB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-300 rounded-lg p-3.5 text-xs font-mono outline-hidden resize-none leading-relaxed h-80 scrollbar-thin"
              />
            </div>
          </div>
        </div>

        {/* AI comparative report output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
              AI Auditor Report Output
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Laporan kecerdasan hukum buatan Gemini AI.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center text-center py-16 h-full min-h-72">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <p className="font-sans text-xs text-slate-400 font-semibold">Sedang meninjau silang draf hukum...</p>
              <p className="font-sans text-[10px] text-slate-500 max-w-xs mt-1">
                Gemini sedang mendeteksi amandemen biaya sewa, deposit, sanksi, serta mengevaluasi legal risk exposure.
              </p>
            </div>
          ) : report ? (
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-5 leading-relaxed overflow-y-auto max-h-110 scrollbar-thin">
              {renderComparisonReport(report)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-slate-850 rounded-lg h-full min-h-72 bg-slate-950/20">
              <ArrowLeftRight className="w-10 h-10 text-slate-800 mb-2" />
              <p className="font-sans text-xs text-slate-500 font-semibold">Laporan Perbandingan Belum Dihasilkan</p>
              <p className="font-sans text-[10px] text-slate-600 max-w-xs mt-0.5">
                Pilih skenario pintasan di atas atau masukkan draf secara manual lalu klik tombol Bandingkan Kontrak.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
