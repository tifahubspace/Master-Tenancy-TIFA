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
  FileCheck,
  X,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { addDocument } from '../lib/db';
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
import { Payment, Lease, PaymentStatus, PaymentMethod } from '../types';

const formatIDR = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

interface PaymentsPanelProps {
  payments: Payment[];
  leases: Lease[];
  isAdmin: boolean;
}

export default function PaymentsPanel({ payments, leases, isAdmin }: PaymentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  // Payment Form State
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [loggingPayment, setLoggingPayment] = useState(false);

  // Handle Recording Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseId || !amount || !dueDate) {
      alert("Mohon isi semua bidang yang wajib diisi.");
      return;
    }

    setLoggingPayment(true);
    try {
      const lease = leases.find(l => l.id === selectedLeaseId);
      if (!lease) throw new Error("Kontrak sewa tidak ditemukan");

      const payId = "pay-" + Date.now().toString().slice(-4);
      const newPayment: Payment = {
        id: payId,
        leaseId: selectedLeaseId,
        tenantId: lease.tenantId,
        tenantName: lease.tenantName,
        propertyId: lease.propertyId,
        propertyName: lease.propertyName,
        unitNumber: lease.unitNumber,
        amount: Number(amount),
        dueDate,
        paymentDate: paymentStatus === 'paid' || paymentStatus === 'partial' || paymentStatus === 'late' ? (paymentDate || new Date().toISOString().split('T')[0]) : undefined,
        status: paymentStatus,
        method: paymentStatus !== 'overdue' ? paymentMethod : undefined,
        notes,
        createdAt: new Date().toISOString()
      };

      await addDocument("payments", newPayment);

      // Reset
      setSelectedLeaseId('');
      setAmount('');
      setDueDate('');
      setPaymentDate('');
      setPaymentStatus('paid');
      setPaymentMethod('bank_transfer');
      setNotes('');
      setShowAddPayment(false);
    } catch (err) {
      console.error("Error recording payment:", err);
    } finally {
      setLoggingPayment(false);
    }
  };

  // Prepare Chart Data (Rent Collections by Month or Tenant)
  const chartData = payments.reduce((acc: any[], payment) => {
    const month = payment.dueDate.substring(0, 7); // YYYY-MM
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      if (payment.status === 'paid' || payment.status === 'late') {
        existing.Collected += payment.amount;
      } else if (payment.status === 'partial') {
        existing.Collected += (payment.amount * 0.5); // Estimate partial as half
        existing.Outstanding += (payment.amount * 0.5);
      } else {
        existing.Outstanding += payment.amount;
      }
    } else {
      acc.push({
        month,
        Collected: (payment.status === 'paid' || payment.status === 'late') ? payment.amount : (payment.status === 'partial' ? payment.amount * 0.5 : 0),
        Outstanding: payment.status === 'overdue' ? payment.amount : (payment.status === 'partial' ? payment.amount * 0.5 : 0)
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  // Pie Chart Data
  const statusCounts = payments.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + p.amount;
    return acc;
  }, {});

  const pieData = [
    { name: 'Paid', value: statusCounts['paid'] || 0, color: '#10b981' },
    { name: 'Late', value: statusCounts['late'] || 0, color: '#f59e0b' },
    { name: 'Partial', value: statusCounts['partial'] || 0, color: '#6366f1' },
    { name: 'Overdue', value: statusCounts['overdue'] || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="payments-panel-root">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5.5 h-5.5 text-emerald-600 animate-pulse" />
            Pembayaran Sewa & Buku Kas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pelacakan real-time dari tagihan sewa, penerimaan bulanan, dan sisa tunggakan.
          </p>
        </div>
        
        {isAdmin && (
          <button
            id="btn-log-payment"
            onClick={() => setShowAddPayment(true)}
            className="w-full sm:w-auto px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi Pembayaran
          </button>
        )}
      </div>

      {/* Record Payment Form Modal */}
      {showAddPayment && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm" id="form-log-payment">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Catat Entri Buku Kas Sewa
            </h3>
            <button onClick={() => setShowAddPayment(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Pilih Kontrak Sewa Aktif *</label>
                <select
                  required
                  value={selectedLeaseId}
                  onChange={e => {
                    setSelectedLeaseId(e.target.value);
                    const lease = leases.find(l => l.id === e.target.value);
                    if (lease) setAmount(lease.monthlyRent.toString());
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Penyewa / Kontrak --</option>
                  {leases.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.tenantName} — {l.propertyName} ({l.unitNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Jumlah Dibayarkan (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="15000000"
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Catatan Transaksi</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Sewa untuk Maret 2026"
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Status Pembayaran *</label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                >
                  <option value="paid">Lunas (Paid)</option>
                  <option value="partial">Sebagian (Partial)</option>
                  <option value="late">Terlambat (Late)</option>
                  <option value="overdue">Tunggakan (Overdue)</option>
                </select>
              </div>

              {paymentStatus !== 'overdue' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Metode Pembayaran *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="check">Cek (Check)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {paymentStatus !== 'overdue' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="px-4.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loggingPayment}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loggingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Catat Pembayaran"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="payment-charts-container">
        
        {/* Collection Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Arus Kas Bulanan
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Penerimaan sewa vs sisa tunggakan.</p>
            </div>
          </div>
          
          <div className="h-60" id="cashflow-chart">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                Belum ada riwayat pembayaran yang cukup untuk ditampilkan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatIDR(Number(value))} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend formatter={(value) => value === 'Collected' ? 'Diterima' : 'Tunggakan'} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name="Diterima" dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Tunggakan" dataKey="Outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Collection Breakdown Pie Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-xs">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 mb-4">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            Distribusi Pendapatan
          </h4>
          
          <div className="h-44 flex items-center justify-center" id="pie-breakdown-chart">
            {pieData.length === 0 ? (
              <div className="text-gray-400 text-xs">Belum ada transaksi yang tercatat.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatIDR(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-900">
            {pieData.map((d, index) => {
              const indonesianName = d.name === 'Paid' ? 'Lunas' : d.name === 'Late' ? 'Terlambat' : d.name === 'Partial' ? 'Sebagian' : d.name === 'Overdue' ? 'Tunggakan' : d.name;
              return (
                <div key={index} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: d.color }}></span>
                  {indonesianName}: {formatIDR(d.value)}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-xs" id="ledger-table-container">
        
        {/* Filter Controls */}
        <div className="p-4.5 border-b border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Riwayat Pembayaran Historis</h3>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari transaksi buku kas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-xs outline-none focus:border-emerald-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-xs outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="partial">Sebagian (Partial)</option>
              <option value="late">Terlambat (Late)</option>
              <option value="overdue">Tunggakan (Overdue)</option>
            </select>
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/55 dark:bg-black border-b border-gray-100 dark:border-gray-900">
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Penyewa</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Properti & Unit</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Jatuh Tempo</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Diterima</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Metode</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 tracking-wider">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada transaksi yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const translatedMethod = p.method === 'bank_transfer' ? 'Transfer Bank' : p.method === 'credit_card' ? 'Kartu Kredit' : p.method === 'cash' ? 'Tunai' : p.method === 'check' ? 'Cek' : p.method || '—';
                  const translatedStatus = p.status === 'paid' ? 'Lunas' : p.status === 'late' ? 'Terlambat' : p.status === 'partial' ? 'Sebagian' : p.status === 'overdue' ? 'Tunggakan' : p.status;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">{p.tenantName}</td>
                      <td className="p-3.5 text-gray-700 dark:text-gray-300 font-medium">{p.propertyName} (Unit {p.unitNumber})</td>
                      <td className="p-3.5 font-mono text-gray-500">{p.dueDate}</td>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">{formatIDR(p.amount)}</td>
                      <td className="p-3.5 font-mono text-gray-500 capitalize">{translatedMethod}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          p.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          p.status === 'partial' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                        }`}>
                          {translatedStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 italic max-w-xs truncate">{p.notes || "—"}</td>
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
