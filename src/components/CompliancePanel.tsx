import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  FileWarning,
  UserCheck,
  Send
} from 'lucide-react';
import { addDocument } from '../lib/db';
import { Lease } from '../types';

export type ComplianceCategory = 'noise' | 'maintenance' | 'pets' | 'unauthorized_guests' | 'late_payment' | 'other';
export type ComplianceSeverity = 'low' | 'medium' | 'high';
export type ComplianceCaseStatus = 'under_review' | 'escalated' | 'resolved';

export interface Compliance {
  id: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  propertyId?: string;
  propertyName: string;
  unitNumber: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  status: ComplianceCaseStatus;
  details: string;
  reportedBy: string;
  dateReported: string;
  createdAt: string;
}

interface CompliancePanelProps {
  compliance: Compliance[];
  leases: Lease[];
  isAdmin: boolean;
}

export default function CompliancePanel({ compliance = [], leases = [], isAdmin }: CompliancePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showAddReport, setShowAddReport] = useState(false);
  
  // Notice Generator State
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [generatingNoticeId, setGeneratingNoticeId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Compliance | null>(null);
  const [noticePanelOpen, setNoticePanelOpen] = useState(false);

  // New Compliance Report Form State
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [category, setCategory] = useState<ComplianceCategory>('noise');
  const [severity, setSeverity] = useState<ComplianceSeverity>('medium');
  const [details, setDetails] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [dateReported, setDateReported] = useState('');
  const [reporting, setReporting] = useState(false);

  // Handle Reporting Violation
  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseId || !details || !reportedBy || !dateReported) {
      alert("Silakan isi semua bidang yang wajib diisi.");
      return;
    }

    setReporting(true);
    try {
      const lease = leases.find(l => l.id === selectedLeaseId);
      if (!lease) throw new Error("Lease tidak ditemukan");

      const compId = "comp-" + Date.now().toString().slice(-4);
      const newReport: Compliance = {
        id: compId,
        leaseId: selectedLeaseId,
        tenantId: lease.tenantId,
        tenantName: lease.tenantName,
        propertyId: lease.buildingId,
        propertyName: lease.buildingName,
        unitNumber: lease.unitNumber,
        category,
        severity,
        status: 'under_review',
        details,
        reportedBy,
        dateReported,
        createdAt: new Date().toISOString()
      };

      // We save in the notifications or compliance database dynamically
      await addDocument("notifications", {
        title: `Laporan Pelanggaran: ${lease.tenantName}`,
        message: `Insiden ${category} dilaporkan oleh ${reportedBy} di unit ${lease.unitNumber}.`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        type: 'system'
      });

      alert("Laporan kepatuhan berhasil ditambahkan ke log sistem!");

      // Reset
      setSelectedLeaseId('');
      setCategory('noise');
      setSeverity('medium');
      setDetails('');
      setReportedBy('');
      setDateReported('');
      setShowAddReport(false);
    } catch (err) {
      console.error("Error creating compliance report:", err);
    } finally {
      setReporting(false);
    }
  };

  // Generate AI formal warning notice
  const handleGenerateNotice = async (record: Compliance) => {
    setSelectedCase(record);
    setGeneratingNoticeId(record.id);
    setNoticePanelOpen(true);
    setActiveNotice(null);
    try {
      const response = await fetch('/api/gemini/compliance-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: record.tenantName,
          unitNumber: record.unitNumber,
          category: record.category,
          severity: record.severity,
          details: record.details
        })
      });
      const data = await response.json();
      setActiveNotice(data.notice || "Gagal membuat draf surat teguran hukum. Silakan coba beberapa saat lagi.");
    } catch (err) {
      console.error(err);
      setActiveNotice("Gagal terhubung dengan asisten penyusunan hukum.");
    } finally {
      setGeneratingNoticeId(null);
    }
  };

  const updateCaseStatus = async (docId: string, currentRecord: Compliance, newStatus: ComplianceCaseStatus) => {
    if (!isAdmin) return;
    alert(`Status kasus ${docId} diperbarui menjadi ${newStatus === 'resolved' ? 'Selesai (Resolved)' : newStatus}`);
  };

  const filteredCompliance = compliance.filter(c => {
    const matchesSearch = 
      c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.propertyName && c.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6 bg-slate-950 p-6 rounded-xl border border-slate-900" id="compliance-panel-root">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-sans font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
            Kepatuhan & Keamanan Gedung
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Catat pelanggaran tata tertib gedung, pantau status komplain, dan terbitkan draf teguran AI.
          </p>
        </div>
        
        {isAdmin && (
          <button
            id="btn-file-compliance"
            onClick={() => setShowAddReport(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Laporkan Pelanggaran
          </button>
        )}
      </div>

      {/* File Violation Form */}
      {showAddReport && (
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800" id="form-file-compliance">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-amber-500" />
              Laporkan Pelanggaran Tata Tertib
            </h3>
            <button onClick={() => setShowAddReport(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleReportViolation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tenant / Unit Terkait *</label>
                <select
                  required
                  value={selectedLeaseId}
                  onChange={e => setSelectedLeaseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Tenant --</option>
                  {leases.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.tenantName} — {l.buildingName} ({l.unitNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Kategori Insiden *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ComplianceCategory)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="noise">Kebisingan / Ketertiban</option>
                  <option value="maintenance">Pemeliharaan / Masalah Sampah</option>
                  <option value="pets">Hewan Peliharaan</option>
                  <option value="unauthorized_guests">Tamu Tanpa Izin</option>
                  <option value="late_payment">Keterlambatan Pembayaran</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tingkat Keparahan *</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as ComplianceSeverity)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="low">Rendah (Teguran lisan)</option>
                  <option value="medium">Sedang (Teguran tertulis & denda)</option>
                  <option value="high">Tinggi (Eskalasi darurat)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Detail Kejadian Faktual *</label>
                <textarea
                  required
                  rows={2}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Sediakan kronologi kejadian, jam, dan tindakan pengamanan..."
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500 resize-none font-sans"
                ></textarea>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Dilaporkan Oleh *</label>
                  <input
                    type="text"
                    required
                    value={reportedBy}
                    onChange={e => setReportedBy(e.target.value)}
                    placeholder="misal: Petugas Keamanan"
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Tanggal Kejadian *</label>
                  <input
                    type="date"
                    required
                    value={dateReported}
                    onChange={e => setDateReported(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddReport(false)}
                className="px-4 py-1.5 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Laporan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="compliance-workspace-grid">
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filtering Header */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari detail insiden, nama tenant..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="noise">Kebisingan</option>
                <option value="maintenance">Pemeliharaan</option>
                <option value="pets">Hewan</option>
                <option value="unauthorized_guests">Tamu</option>
                <option value="late_payment">Keterlambatan</option>
                <option value="other">Lainnya</option>
              </select>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-2 py-1.5 border border-slate-800 rounded-lg bg-slate-950 text-xs text-white outline-none focus:border-amber-500"
              >
                <option value="all">Semua Skala</option>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
          </div>

          {/* List Display */}
          <div className="space-y-4">
            {filteredCompliance.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center" id="empty-compliance">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-pulse" />
                <p className="text-white font-bold text-sm">Aman & Terkendali</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada insiden aktif atau pelanggaran keamanan saat ini.</p>
              </div>
            ) : (
              filteredCompliance.map((record) => (
                <div 
                  key={record.id}
                  id={`compliance-card-${record.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition-all duration-200 flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${
                        record.severity === 'high' ? 'bg-rose-950/40 text-rose-400 border-rose-900/60' :
                        record.severity === 'medium' ? 'bg-amber-950/40 text-amber-400 border-amber-900/60' :
                        'bg-blue-950/40 text-blue-400 border-blue-900/60'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-xs">{record.tenantName}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            record.severity === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            record.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}>
                            {record.severity}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            record.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-850' :
                            'bg-amber-950 text-amber-400 border border-amber-850'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          {record.propertyName || "TIFA Building"} — Unit {record.unitNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono sm:text-right">
                      <p>Insiden: {record.dateReported}</p>
                      <p className="mt-0.5">Pelapor: {record.reportedBy}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{record.details}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-850">
                    <div className="flex gap-1.5">
                      {record.status !== 'resolved' && isAdmin && (
                        <button
                          id={`btn-resolve-${record.id}`}
                          onClick={() => updateCaseStatus(record.id, record, 'resolved')}
                          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Selesaikan Kasus
                        </button>
                      )}
                    </div>

                    <button
                      id={`btn-draft-notice-${record.id}`}
                      onClick={() => handleGenerateNotice(record)}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold py-1 px-3 shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Tulis Teguran AI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Drafting notice Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4" id="notice-sidebar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 font-sans">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                Draf Hukum AI Teguran
              </h3>
              {noticePanelOpen && (
                <button onClick={() => { setNoticePanelOpen(false); setActiveNotice(null); }} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {noticePanelOpen ? (
              <div className="space-y-4">
                {generatingNoticeId ? (
                  <div className="py-12 text-center space-y-3" id="notice-generating-loader">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                    <p className="text-xs text-slate-400">Merumuskan surat peringatan resmi...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-slate-300 text-[11px] leading-relaxed max-h-[300px] overflow-y-auto pr-1" id="notice-draft-output">
                      {activeNotice ? (
                        <div className="space-y-2 whitespace-pre-wrap font-sans bg-slate-950 p-3.5 rounded-lg border border-slate-850">
                          {activeNotice}
                        </div>
                      ) : (
                        <p>Draf belum dibuat.</p>
                      )}
                    </div>
                    {activeNotice && (
                      <button
                        id="btn-send-warning-mock"
                        onClick={() => {
                          alert(`Surat teguran resmi berhasil disalurkan ke ${selectedCase?.tenantName || 'tenant'}!`);
                          setNoticePanelOpen(false);
                          setActiveNotice(null);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Kirim Surat Peringatan
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedCase ? (
              <div className="py-8 text-center space-y-3" id="notice-idle-selected">
                <FileWarning className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h4 className="font-bold text-white text-xs">Terpilih: {selectedCase.tenantName}</h4>
                <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-normal">
                  Rancang draf surat resmi otomatis dengan AI Hukum.
                </p>
                <button
                  id="btn-trigger-ai-draft"
                  onClick={() => handleGenerateNotice(selectedCase)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Buat Draf
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2" id="notice-idle-sidebar">
                <FileWarning className="w-8 h-8 mx-auto text-slate-750" />
                <p className="text-[11px] leading-normal">Pilih salah satu insiden, lalu jalankan pembuatan draf hukum otomatis.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
