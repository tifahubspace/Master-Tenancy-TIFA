import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Search, 
  Sparkles, 
  Building, 
  User, 
  CheckCircle2, 
  X, 
  FileMinus, 
  Loader2,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { addDocument, deleteDocument } from '../lib/db';
import { Lease, Building as BuildingType } from '../types';

interface LeasesPanelProps {
  leases: Lease[];
  buildings: BuildingType[];
  onRefresh: () => void;
}

export default function LeasesPanel({ leases, buildings, onRefresh }: LeasesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingLeaseId, setAnalyzingLeaseId] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // New Lease Form State
  const [showAddLease, setShowAddLease] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedBldId, setSelectedBldId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [billingDay, setBillingDay] = useState(5);
  const [signingLease, setSigningLease] = useState(false);

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSignLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantEmail || !selectedBldId || !unitNumber || !startDate || !endDate || !monthlyRent) {
      alert("Mohon isi seluruh field bertanda bintang.");
      return;
    }

    setSigningLease(true);
    try {
      const bld = buildings.find(b => b.id === selectedBldId);
      const lId = `lease-${Date.now()}`;
      
      const newLease = {
        id: lId,
        tenantId: `ten-${Date.now()}`,
        tenantName,
        tenantEmail,
        buildingId: selectedBldId,
        buildingName: bld ? bld.name : "TIFA Building",
        unitNumber,
        floorNumber: "02", // default floor
        startDate,
        endDate,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit) || Number(monthlyRent) * 2,
        billingDay: Number(billingDay),
        status: "awaiting_approval", // Put it in approval queue
        approvalStage: "legal", // legal review first
        googleDriveUrl: `https://drive.google.com/drive/folders/tpms-lease-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: "Property Manager"
      };

      await addDocument("leases", newLease);

      // Create workflow stage
      const newWf = {
        id: `wf-${Date.now()}`,
        leaseId: lId,
        tenantName,
        buildingName: bld ? bld.name : "TIFA Building",
        unitNumber,
        requestedBy: "Property Manager",
        requestedAt: new Date().toISOString(),
        stage: "legal",
        status: "pending",
        comments: "Kontrak baru dimasukkan secara manual oleh Property Manager. Harap tinjau klausul legal."
      };
      await addDocument("approvalWorkflows", newWf);

      // Reset
      setTenantName('');
      setTenantEmail('');
      setSelectedBldId('');
      setUnitNumber('');
      setStartDate('');
      setEndDate('');
      setMonthlyRent('');
      setSecurityDeposit('');
      setBillingDay(5);
      setShowAddLease(false);
      onRefresh();
      alert("Draf kontrak sewa berhasil dibuat dan diajukan ke antrean Approval Workflow!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal membuat kontrak: " + err.message);
    } finally {
      setSigningLease(false);
    }
  };

  const analyzeLease = async (lease: Lease) => {
    setAnalyzingLeaseId(lease.id);
    setAiPanelOpen(true);
    setAiAnalysis(null);
    try {
      const response = await fetch('/api/gemini/analyze-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: lease.buildingName,
          tenantName: lease.tenantName,
          monthlyRent: lease.monthlyRent,
          securityDeposit: lease.securityDeposit,
          startDate: lease.startDate,
          endDate: lease.endDate,
          billingDay: lease.billingDay
        })
      });
      const data = await response.json();
      setAiAnalysis(data.analysis || "Analisis tidak berhasil ditarik.");
    } catch (err: any) {
      console.error(err);
      setAiAnalysis("Koneksi gagal. Layanan Gemini AI tidak terjangkau.");
    } finally {
      setAnalyzingLeaseId(null);
    }
  };

  const handleDeleteLease = async (id: string) => {
    if (!confirm("Hapus draf kontrak ini?")) return;
    try {
      await deleteDocument("leases", id);
      onRefresh();
      setSelectedLease(null);
      alert("Kontrak berhasil dihapus.");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const filteredLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && lease.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-cyan-400" />
            Lease & Contract Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Daftarkan draf sewa komersial baru, analisis sanksi denda, dan hubungkan draf ke Google Drive.
          </p>
        </div>

        <button
          id="btn-add-lease-trigger"
          onClick={() => setShowAddLease(true)}
          className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-xs font-bold py-2 px-4.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajukan Kontrak Baru
        </button>
      </div>

      {/* Lease Creator Form Overlay */}
      {showAddLease && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-6 relative shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin">
            <h3 className="font-sans font-bold text-sm text-white mb-4 flex items-center gap-1.5">
              Pendaftaran & Pengajuan Kontrak Sewa Baru
            </h3>
            
            <form onSubmit={handleSignLease} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nama Tenant *</label>
                  <input type="text" placeholder="PT Global Media" required value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Email Tenant *</label>
                  <input type="email" placeholder="finance@tenant.co.id" required value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Gedung *</label>
                  <select required value={selectedBldId} onChange={(e) => setSelectedBldId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="">Pilih Gedung...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nomor Unit *</label>
                  <input type="text" placeholder="Suite 302" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Harga Sewa Bulanan (Rp) *</label>
                  <input type="number" required placeholder="45000000" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Security Deposit (Rp)</label>
                  <input type="number" placeholder="Default: 2x Sewa" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tgl Mulai *</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tgl Berakhir *</label>
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Jatuh Tempo *</label>
                  <input type="number" min="1" max="28" required value={billingDay} onChange={(e) => setBillingDay(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowAddLease(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                <button type="submit" disabled={signingLease} className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-1">
                  {signingLease ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ajukan Draf Sewa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: List & AI Audit Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leases Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Toolbar Filters */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari penyewa, gedung, unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg pl-9 pr-3 py-2 text-xs font-sans outline-hidden"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-sans outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif (Active)</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="terminated">Diputus (Terminated)</option>
            </select>
          </div>

          {/* Lease Cards */}
          <div className="space-y-3">
            {filteredLeases.length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-12 text-center">
                <FileMinus className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h4 className="font-sans font-semibold text-sm text-slate-400">Kontrak Tidak Ditemukan</h4>
                <p className="font-sans text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Gunakan tombol di sudut kanan atas untuk mendaftarkan kontrak baru.
                </p>
              </div>
            ) : (
              filteredLeases.map((l) => {
                const isSelected = selectedLease?.id === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLease(l)}
                    className={`bg-slate-900 border p-5 rounded-xl transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isSelected ? "border-cyan-500 shadow-md shadow-cyan-500/5 bg-slate-950/40" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-sans font-bold text-sm text-white truncate">{l.tenantName}</h4>
                        <span className={`text-[9px] font-bold font-sans px-2 py-0.5 rounded-full ${
                          l.status === "active" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/60" :
                          l.status === "awaiting_approval" ? "bg-cyan-950 text-cyan-400 border border-cyan-900/60" :
                          "bg-rose-950 text-rose-400 border border-rose-900/60"
                        }`}>
                          {l.status === "active" ? "Aktif" : l.status === "awaiting_approval" ? "Reviewing" : "Diputus"}
                        </span>
                        {l.status === "awaiting_approval" && (
                          <span className="text-[9px] font-bold font-sans px-2 py-0.5 rounded-full bg-slate-950 text-slate-500 border border-slate-800">
                            Stage: {l.approvalStage || "legal"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-sans mt-1.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        Gedung: <strong className="text-slate-200">{l.buildingName}</strong> • Unit: <strong className="text-slate-200">{l.unitNumber}</strong>
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {l.startDate} s/d {l.endDate}
                        </span>
                        <span className="text-cyan-400 font-bold">
                          Sewa: Rp {l.monthlyRent?.toLocaleString("id-ID")}/bln
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        id={`btn-analyze-lease-trigger-${l.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzeLease(l);
                        }}
                        className="bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800 hover:border-cyan-600 text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Audit AI
                      </button>
                      <button
                        id={`btn-delete-lease-${l.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLease(l.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800/60 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Audit Panel */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-full sticky top-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Draf Audit Hukum (Gemini AI)
              </h3>
              {aiPanelOpen && (
                <button
                  onClick={() => { setAiPanelOpen(false); setAiAnalysis(null); }}
                  className="text-slate-500 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {aiPanelOpen ? (
              <div className="space-y-4">
                {analyzingLeaseId ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                    <p className="font-sans text-xs text-slate-400 font-semibold">Sedang menganalisis hak penanggungan sewa...</p>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg font-sans text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap text-slate-300 scrollbar-thin">
                    {aiAnalysis}
                  </div>
                )}
              </div>
            ) : selectedLease ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-10 h-10 bg-cyan-950 border border-cyan-800 rounded-full flex items-center justify-center mx-auto text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-xs text-white">{selectedLease.tenantName}</h4>
                  <p className="font-sans text-[11px] text-slate-500">Unit: {selectedLease.unitNumber} • {selectedLease.buildingName}</p>
                </div>
                <p className="font-sans text-[11px] text-slate-400 max-w-xs mx-auto">
                  Dapatkan auditing denda pembayaran sewa, keabsahan klausul, dan jaminan deposit dari asisten Gemini AI.
                </p>
                <button
                  id="btn-run-sidebar-audit"
                  onClick={() => analyzeLease(selectedLease)}
                  className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-sans text-xs font-bold py-1.5 px-4 rounded-md flex items-center justify-center gap-1 mx-auto shadow-md transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mulai Audit AI
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <User className="w-8 h-8 mx-auto text-slate-700" />
                <p className="font-sans text-xs">Pilih salah satu draf kontrak sewa di kolom kiri untuk membuka modul asisten legal auditing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
