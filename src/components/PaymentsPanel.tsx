import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Trash2
} from 'lucide-react';
import { addDocument, deleteDocument } from '../lib/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Payment, Lease } from '../types';

interface PaymentsPanelProps {
  payments: Payment[];
  leases: Lease[];
  onRefresh: () => void;
}

export default function PaymentsPanel({ payments, leases, onRefresh }: PaymentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  // Payment Form State
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'late' | 'overdue'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cash' | 'check'>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [loggingPayment, setLoggingPayment] = useState(false);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseId || !amount || !dueDate) {
      alert("Mohon isi semua bidang yang bertanda bintang.");
      return;
    }

    setLoggingPayment(true);
    try {
      const lease = leases.find(l => l.id === selectedLeaseId);
      if (!lease) throw new Error("Draf kontrak sewa tidak ditemukan");

      const payId = `pay-${Date.now()}`;
      const newPayment = {
        id: payId,
        leaseId: selectedLeaseId,
        tenantId: lease.tenantId,
        tenantName: lease.tenantName,
        buildingId: lease.buildingId,
        buildingName: lease.buildingName,
        unitNumber: lease.unitNumber,
        amount: Number(amount),
        dueDate,
        paymentDate: paymentStatus !== 'overdue' ? (paymentDate || new Date().toISOString().split('T')[0]) : undefined,
        status: paymentStatus,
        method: paymentStatus !== 'overdue' ? paymentMethod : undefined,
        notes,
        createdAt: new Date().toISOString()
      };

      await addDocument("payments", newPayment);

      // Reset Form
      setSelectedLeaseId('');
      setAmount('');
      setDueDate('');
      setPaymentDate('');
      setPaymentStatus('paid');
      setPaymentMethod('bank_transfer');
      setNotes('');
      setShowAddPayment(false);
      onRefresh();
      alert("Transaksi buku kas berhasil dicatat!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal mencatat transaksi: " + err.message);
    } finally {
      setLoggingPayment(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Hapus catatan transaksi ini?")) return;
    try {
      await deleteDocument("payments", id);
      onRefresh();
      alert("Catatan transaksi dihapus.");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.buildingName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.unitNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5.5 h-5.5 text-cyan-400" />
            Keuangan & Buku Kas (Billing)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Mencatat transaksi sewa masuk, mencocokkan tagihan (matching), dan memantau tunggakan operasional.
          </p>
        </div>
        
        <button
          id="btn-add-payment-trigger"
          onClick={() => setShowAddPayment(true)}
          className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-xs font-bold py-2 px-4.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Catat Penerimaan Kas
        </button>
      </div>

      {/* Record Payment Drawer Form */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="font-sans font-bold text-sm text-white mb-4 flex items-center gap-1.5">
              Catat Penerimaan Kas / Transaksi Baru
            </h3>
            
            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Pilih Kontrak Penyewa *</label>
                <select
                  required
                  value={selectedLeaseId}
                  onChange={e => {
                    setSelectedLeaseId(e.target.value);
                    const lease = leases.find(l => l.id === e.target.value);
                    if (lease) setAmount(lease.monthlyRent.toString());
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                >
                  <option value="">Pilih Penyewa...</option>
                  {leases.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.tenantName} — {l.buildingName} ({l.unitNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Jumlah Diterima (Rp) *</label>
                  <input type="number" required placeholder="15000000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Jatuh Tempo *</label>
                  <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Status Transaksi *</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="paid">Lunas (Paid)</option>
                    <option value="partial">Sebagian (Partial)</option>
                    <option value="late">Terlambat (Late)</option>
                    <option value="overdue">Tunggakan (Overdue)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Metode *</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="check">Cek Giro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tanggal Pembayaran</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Catatan</label>
                <input type="text" placeholder="Sewa Bulan Juli" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowAddPayment(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                <button type="submit" disabled={loggingPayment} className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-1">
                  {loggingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Simpan Entri"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider">
            Buku Kas Besar Portofolio (Billing Ledger)
          </h3>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari transaksi sewa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg pl-9 pr-3 py-1.5 text-xs font-sans outline-hidden"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-sans outline-hidden"
            >
              <option value="all">Semua</option>
              <option value="paid">Lunas</option>
              <option value="partial">Sebagian</option>
              <option value="late">Terlambat</option>
              <option value="overdue">Tunggakan</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Tenant</th>
                <th className="py-3.5 px-4">Gedung / Unit</th>
                <th className="py-3.5 px-4">Tgl Jatuh Tempo</th>
                <th className="py-3.5 px-4">Tgl Bayar</th>
                <th className="py-3.5 px-4">Jumlah Penerimaan</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs text-slate-300">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-slate-500 font-sans">
                    Tidak ada riwayat catatan kas masuk yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const methodTxt = p.method === "bank_transfer" ? "Transfer Bank" : p.method === "credit_card" ? "Kartu Kredit" : p.method === "cash" ? "Tunai (Cash)" : p.method === "check" ? "Cek Giro" : "—";
                  return (
                    <tr key={p.id} className="hover:bg-slate-950/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.tenantName}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.buildingName} • {p.unitNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.dueDate}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.paymentDate || "—"}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{formatIDR(p.amount)}</td>
                      <td className="py-3.5 px-4 text-slate-400">{methodTxt}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "paid" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/60" :
                          p.status === "partial" ? "bg-indigo-950 text-indigo-400 border border-indigo-900/60" :
                          p.status === "late" ? "bg-amber-950 text-amber-400 border border-amber-900/60" :
                          "bg-rose-950 text-rose-400 border border-rose-900/60"
                        }`}>
                          {p.status === "paid" ? "Lunas" : p.status === "partial" ? "Sebagian" : p.status === "late" ? "Terlambat" : "Tunggakan"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-delete-payment-${p.id}`}
                          onClick={() => handleDeletePayment(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
