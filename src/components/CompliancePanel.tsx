import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  X, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  CornerDownRight, 
  FileWarning,
  UserCheck,
  Send
} from 'lucide-react';
import { addDocument } from '../lib/db';
import { Compliance, Lease, ComplianceCategory, ComplianceSeverity, ComplianceCaseStatus } from '../types';

interface CompliancePanelProps {
  compliance: Compliance[];
  leases: Lease[];
  isAdmin: boolean;
}

export default function CompliancePanel({ compliance, leases, isAdmin }: CompliancePanelProps) {
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
        propertyId: lease.propertyId,
        propertyName: lease.propertyName,
        unitNumber: lease.unitNumber,
        category,
        severity,
        status: 'under_review',
        details,
        reportedBy,
        dateReported,
        createdAt: new Date().toISOString()
      };

      await addDocument("compliance", newReport);

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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantName: record.tenantName,
          unitNumber: record.unitNumber,
          category: record.category,
          severity: record.severity,
          details: record.details
        })
      });
      const data = await response.json();
      if (data.notice) {
        setActiveNotice(data.notice);
      } else {
        setActiveNotice("Gagal membuat draf surat teguran hukum. Silakan coba beberapa saat lagi.");
      }
    } catch (err) {
      console.error(err);
      setActiveNotice("Gagal terhubung dengan asisten penyusunan hukum.");
    } finally {
      setGeneratingNoticeId(null);
    }
  };

  // Action status updates (Warning Issued, Resolved)
  const updateCaseStatus = async (docId: string, currentRecord: Compliance, newStatus: ComplianceCaseStatus) => {
    if (!isAdmin) return;
    try {
      alert(`Apakah Anda ingin memperbarui status kasus menjadi ${newStatus === 'resolved' ? 'Selesai (Resolved)' : newStatus}?`);
      // Update local state is handled in App.tsx via onSnapshot, let's keep it clean
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCompliance = compliance.filter(c => {
    const matchesSearch = 
      c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6" id="compliance-panel-root">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5.5 h-5.5 text-amber-500 animate-bounce" />
            Kepatuhan & Keamanan Tenant
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Catat pelanggaran kontrak sewa, pantau keluhan aktif, dan buat surat teguran hukum AI secara otomatis.
          </p>
        </div>
        
        {isAdmin && (
          <button
            id="btn-file-compliance"
            onClick={() => setShowAddReport(true)}
            className="w-full sm:w-auto px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Laporkan Insiden Pelanggaran
          </button>
        )}
      </div>

      {/* File Violation Form */}
      {showAddReport && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm" id="form-file-compliance">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-600" />
              Laporkan Insiden Pelanggaran Aturan
            </h3>
            <button onClick={() => setShowAddReport(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleReportViolation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tenant / Unit Terkait *</label>
                <select
                  required
                  value={selectedLeaseId}
                  onChange={e => setSelectedLeaseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Tenant --</option>
                  {leases.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.tenantName} — {l.propertyName} ({l.unitNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Kategori Insiden *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ComplianceCategory)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
                >
                  <option value="noise">Kebisingan / Gangguan Ketertiban</option>
                  <option value="maintenance">Pemeliharaan / Masalah Sampah</option>
                  <option value="pets">Hewan Peliharaan Tanpa Izin</option>
                  <option value="unauthorized_guests">Tamu Tanpa Izin</option>
                  <option value="late_payment">Keterlambatan Pembayaran Sewa</option>
                  <option value="other">Pelanggaran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tingkat Keparahan *</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as ComplianceSeverity)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
                >
                  <option value="low">Rendah (Teguran lisan/kebijaksanaan)</option>
                  <option value="medium">Sedang (Teguran tertulis & denda)</option>
                  <option value="high">Tinggi (Eskalasi darurat/segera)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Detail Insiden Faktual *</label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Sediakan detail tepat, tanggal, waktu, dan tindakan yang telah diambil..."
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500 resize-none"
                ></textarea>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Dilaporkan Oleh *</label>
                  <input
                    type="text"
                    required
                    value={reportedBy}
                    onChange={e => setReportedBy(e.target.value)}
                    placeholder="misal: Keamanan, Tetangga"
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Kejadian *</label>
                  <input
                    type="date"
                    required
                    value={dateReported}
                    onChange={e => setDateReported(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddReport(false)}
                className="px-4.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajukan Insiden Formal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="compliance-workspace-grid">
        
        {/* Compliance Reports Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filtering Header */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-900/50 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari detail insiden, nama tenant..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
              >
                <option value="all">Semua Pelanggaran</option>
                <option value="noise">Kebisingan / Gangguan Ketertiban</option>
                <option value="maintenance">Pemeliharaan / Masalah Sampah</option>
                <option value="pets">Hewan Peliharaan Tanpa Izin</option>
                <option value="unauthorized_guests">Tamu Tanpa Izin</option>
                <option value="late_payment">Keterlambatan Pembayaran</option>
                <option value="other">Pelanggaran Lainnya</option>
              </select>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-amber-500"
              >
                <option value="all">Semua Tingkat Keparahan</option>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
          </div>

          {/* List Display */}
          <div className="space-y-4">
            {filteredCompliance.length === 0 ? (
              <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-12 text-center" id="empty-compliance">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-900 dark:text-white font-semibold text-base">Tingkat Kepatuhan Sempurna!</p>
                <p className="text-sm text-gray-500 mt-1">Tidak ada insiden tenant aktif atau pelanggaran keamanan yang tercatat.</p>
              </div>
            ) : (
              filteredCompliance.map((record) => {
                const translatedSeverity = record.severity === 'high' ? 'Tinggi' : record.severity === 'medium' ? 'Sedang' : 'Rendah';
                const translatedStatus = record.status === 'resolved' ? 'Selesai' : record.status === 'escalated' ? 'Eskalasi' : 'Dalam Tinjauan';
                return (
                  <div 
                    key={record.id}
                    id={`compliance-card-${record.id}`}
                    className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-5 shadow-xs hover:border-gray-200 dark:hover:border-gray-800 transition-all duration-200 flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl border ${
                          record.severity === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          record.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{record.tenantName}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              record.severity === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              record.severity === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              Keparahan: {translatedSeverity}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              record.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              record.status === 'escalated' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {translatedStatus}
                            </span>
                          </div>
                          
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                            {record.propertyName} — Unit {record.unitNumber}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 font-medium sm:text-right">
                        <p>Dilaporkan: {record.dateReported}</p>
                        <p className="mt-0.5 italic">Oleh: {record.reportedBy}</p>
                      </div>
                    </div>

                    {/* Incident Details Block */}
                    <div className="p-3.5 bg-gray-50/70 dark:bg-black border border-gray-100 dark:border-gray-900 rounded-xl">
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">{record.details}</p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-900">
                      <div className="flex gap-1.5">
                        {record.status !== 'resolved' && isAdmin && (
                          <button
                            id={`btn-resolve-${record.id}`}
                            onClick={() => updateCaseStatus(record.id, record, 'resolved')}
                            className="px-3 py-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Selesaikan Kasus
                          </button>
                        )}
                      </div>

                      <button
                        id={`btn-draft-notice-${record.id}`}
                        onClick={() => handleGenerateNotice(record)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Draf Surat Teguran AI
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Drafting notice Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl shadow-sm p-5 space-y-4" id="notice-sidebar">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                Generator Teguran Tenant AI
              </h3>
              {noticePanelOpen && (
                <button onClick={() => { setNoticePanelOpen(false); setActiveNotice(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {noticePanelOpen ? (
              <div className="space-y-4">
                {generatingNoticeId ? (
                  <div className="py-12 text-center space-y-3" id="notice-generating-loader">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                    <p className="text-sm text-gray-500 font-medium">Membuat surat teguran resmi...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed max-h-[420px] overflow-y-auto pr-1" id="notice-draft-output">
                      {activeNotice ? (
                        <div className="space-y-2 whitespace-pre-wrap font-sans bg-gray-50/50 dark:bg-black/50 p-3 rounded-xl border border-gray-100/60 dark:border-gray-900">
                          {activeNotice}
                        </div>
                      ) : (
                        <p>Draf surat teguran belum tersedia.</p>
                      )}
                    </div>
                    {activeNotice && (
                      <button
                        id="btn-send-warning-mock"
                        onClick={() => {
                          alert(`Surat teguran kepatuhan berhasil dikirim ke ${selectedCase?.tenantName || 'tenant'}!`);
                          setNoticePanelOpen(false);
                          setActiveNotice(null);
                        }}
                        className="w-full px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Kirim Teguran ke Tenant
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedCase ? (
              <div className="py-8 text-center space-y-3" id="notice-idle-selected">
                <FileWarning className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Terpilih: {selectedCase.tenantName}</h4>
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto text-center">
                  Buat draf surat teguran dan kepatuhan resmi secara otomatis berdasarkan detail pelanggaran sewa.
                </p>
                <button
                  id="btn-trigger-ai-draft"
                  onClick={() => handleGenerateNotice(selectedCase)}
                  className="px-4.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-transform hover:scale-101 flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Buat Draf
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2" id="notice-idle-sidebar">
                <FileWarning className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-xs font-medium">Pilih laporan kepatuhan dan klik "Draf Surat Teguran AI" untuk membuat surat resmi management.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
