import React, { useState } from "react";
import { 
  CheckSquare, 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  User, 
  FileText, 
  Check, 
  X, 
  ShieldAlert,
  Search,
  Filter
} from "lucide-react";
import { updateDocument } from "../lib/db";

interface AuditAndWorkflowProps {
  leases: any[];
  workflows: any[];
  auditLogs: any[];
  onRefresh: () => void;
  activeSubTab?: 'workflow' | 'audit';
}

export default function AuditAndWorkflow({ 
  leases, 
  workflows, 
  auditLogs, 
  onRefresh,
  activeSubTab = 'workflow'
}: AuditAndWorkflowProps) {
  const [activeTab, setActiveTab] = useState<'workflow' | 'audit'>(activeSubTab);
  const [comment, setComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("");

  const handleApprove = async (wf: any) => {
    try {
      const lease = leases.find(l => l.id === wf.leaseId);
      if (!lease) return;

      if (wf.stage === "legal") {
        // Advance legal approval to finance stage!
        await updateDocument("approvalWorkflows", wf.id, {
          status: "approved",
          comments: comment || "Legal clauses reviewed and approved."
        });

        // Update lease approval stage progress
        await updateDocument("leases", lease.id, {
          approvalStage: "finance"
        });

        // Add a new workflow entry for the finance stage
        const nextWf = {
          id: `wf-${Date.now()}`,
          leaseId: lease.id,
          tenantName: lease.tenantName,
          buildingName: lease.buildingName,
          unitNumber: lease.unitNumber,
          requestedBy: "Legal Approver (Ahmad)",
          requestedAt: new Date().toISOString(),
          stage: "finance",
          status: "pending",
          comments: "Legal stage passed. Finance verification required for security deposit."
        };
        // We write using window.db or our database directly
        await updateDocument("approvalWorkflows", nextWf.id, nextWf);

      } else if (wf.stage === "finance") {
        // Finance approved -> Lease becomes fully ACTIVE!
        await updateDocument("approvalWorkflows", wf.id, {
          status: "approved",
          comments: comment || "Security deposit received. Lease activated."
        });

        await updateDocument("leases", lease.id, {
          status: "active",
          approvalStage: "completed"
        });
      }

      setComment("");
      onRefresh();
      alert("Persetujuan sukses diproses!");
    } catch (err: any) {
      alert("Gagal melakukan persetujuan: " + err.message);
    }
  };

  const handleReject = async (wf: any) => {
    if (!comment.trim()) {
      alert("Mohon masukkan alasan penolakan pada kolom komentar.");
      return;
    }

    try {
      await updateDocument("approvalWorkflows", wf.id, {
        status: "rejected",
        comments: comment
      });

      await updateDocument("leases", wf.leaseId, {
        status: "terminated" // terminate/cancel draft
      });

      setComment("");
      onRefresh();
      alert("Kontrak ditolak.");
    } catch (err: any) {
      alert("Gagal menolak kontrak: " + err.message);
    }
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = filterModule ? log.module.toLowerCase() === filterModule.toLowerCase() : true;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800">
        <button
          id="btn-subtab-workflows"
          onClick={() => setActiveTab('workflow')}
          className={`px-5 py-3 font-sans text-xs font-bold tracking-wider uppercase border-b-2 flex items-center gap-2 transition ${
            activeTab === 'workflow'
              ? "border-cyan-500 text-cyan-400 bg-cyan-950/10"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Approval Workflows ({workflows.filter(w => w.status === 'pending').length})
        </button>
        <button
          id="btn-subtab-audit"
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 font-sans text-xs font-bold tracking-wider uppercase border-b-2 flex items-center gap-2 transition ${
            activeTab === 'audit'
              ? "border-cyan-500 text-cyan-400 bg-cyan-950/10"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trails & Logs
        </button>
      </div>

      {activeTab === 'workflow' ? (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
              Antrean Persetujuan Kontrak Sewa Gedung
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
              Tinjau draf sewa komersial yang diajukan oleh Property Manager atau AI OCR. Proses persetujuan terbagi menjadi dua gerbang utama: **Pemeriksaan Legalitas Klausa** (Legal Stage) dan **Verifikasi Pembayaran Jaminan** (Finance Stage).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {workflows.filter(w => w.status === 'pending').length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                <h4 className="font-sans font-semibold text-sm text-slate-300">Semua Bersih!</h4>
                <p className="font-sans text-xs text-slate-500 max-w-sm mt-1">
                  Tidak ada pengajuan sewa baru yang memerlukan tindakan persetujuan Anda saat ini.
                </p>
              </div>
            ) : (
              workflows.filter(w => w.status === 'pending').map((wf) => {
                const lease = leases.find(l => l.id === wf.leaseId);
                return (
                  <div key={wf.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-sans">{wf.tenantName}</span>
                          <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded-full ${
                            wf.stage === "legal" ? "bg-indigo-950 text-indigo-400 border border-indigo-800" : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          }`}>
                            {wf.stage === "legal" ? "Legal Review Stage" : "Finance Security Stage"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mt-1">
                          Gedung: <strong className="text-slate-300">{wf.buildingName}</strong> • Unit: <strong className="text-slate-300">{wf.unitNumber}</strong> • Pengaju: <span className="text-slate-500">{wf.requestedBy} ({new Date(wf.requestedAt).toLocaleDateString()})</span>
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Sewa Bulanan</p>
                        <p className="text-xs font-bold text-cyan-400 font-mono mt-0.5">
                          Rp {lease?.monthlyRent?.toLocaleString("id-ID") || "0"}
                        </p>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    {lease && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-850/60 font-sans text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Security Deposit:</span>
                          <span className="font-bold text-white font-mono">Rp {lease.securityDeposit?.toLocaleString("id-ID")}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Durasi Kontrak:</span>
                          <span className="font-bold text-white">{lease.startDate} s/d {lease.endDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Jatuh Tempo Bulanan:</span>
                          <span className="font-bold text-white">Hari ke-{lease.billingDay}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Folder Kontrak:</span>
                          <a href={lease.googleDriveUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold">
                            Google Drive ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Pending comment info */}
                    <div className="text-xs font-sans text-slate-400 flex gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850/40">
                      <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block">Keterangan Pengajuan:</span>
                        <p className="text-slate-400 mt-0.5">{wf.comments}</p>
                      </div>
                    </div>

                    {/* Actions and comment input */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">
                          Catatan / Komentar Keputusan (Wajib apabila menolak):
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan catatan hukum, persetujuan keuangan, atau revisi..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-2 text-xs font-sans outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          id={`btn-reject-wf-${wf.id}`}
                          onClick={() => handleReject(wf)}
                          className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800/80 hover:border-rose-700 text-rose-400 hover:text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 transition"
                        >
                          <X className="w-4 h-4" />
                          Tolak Draf
                        </button>
                        <button
                          id={`btn-approve-wf-${wf.id}`}
                          onClick={() => handleApprove(wf)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/10"
                        >
                          <Check className="w-4 h-4" />
                          Setujui & Lanjutkan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audit Trail Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari logs berdasarkan aktivitas atau user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg pl-9 pr-3 py-2 text-xs font-sans outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-sans outline-hidden"
              >
                <option value="">Semua Modul</option>
                <option value="BUILDINGS">Buildings</option>
                <option value="LEASES">Leases</option>
                <option value="PAYMENTS">Payments</option>
                <option value="TENANTS">Tenants</option>
                <option value="AI Contract Intelligence">AI OCR</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Tindakan / Action</th>
                    <th className="py-3.5 px-4">Pengguna / User</th>
                    <th className="py-3.5 px-4">Modul</th>
                    <th className="py-3.5 px-4">Detail Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-xs text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-slate-500 font-sans">
                        Tidak ada catatan log audit yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/30 transition">
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                            log.action.includes("DELETE") ? "bg-rose-950/50 text-rose-400 border border-rose-900/60" :
                            log.action.includes("ADD") || log.action.includes("CREATE") ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/60" :
                            "bg-slate-950 text-slate-400 border border-slate-800"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {log.user}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {log.module}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
