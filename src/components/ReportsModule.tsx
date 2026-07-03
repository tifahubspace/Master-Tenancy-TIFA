import React from "react";
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
  Cell,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, Users, DollarSign, Percent, ArrowUpRight, Award, ShieldAlert } from "lucide-react";

interface ReportsModuleProps {
  buildings: any[];
  units: any[];
  leases: any[];
  payments: any[];
}

export default function ReportsModule({
  buildings,
  units,
  leases,
  payments
}: ReportsModuleProps) {
  
  // Calculate analytics data
  const totalBuildings = buildings.length;
  const totalUnitsCount = units.length;
  const leasedUnitsCount = units.filter(u => u.status === "leased").length;
  const emptyUnitsCount = units.filter(u => u.status === "empty").length;
  const maintenanceUnitsCount = units.filter(u => u.status === "maintenance").length;
  const portfolioOccupancyRate = totalUnitsCount > 0 
    ? Math.round((leasedUnitsCount / totalUnitsCount) * 100) 
    : 0;

  // Monthly Revenue Sum
  const totalRevenue = leases
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + Number(l.monthlyRent || 0), 0);

  const collectedPaymentsSum = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const overduePaymentsSum = payments
    .filter(p => p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingPaymentsSum = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 1. Occupancy Data per Building
  const occupancyChartData = buildings.map(b => {
    const bldUnits = units.filter(u => u.buildingName === b.name);
    const totalBldUnits = bldUnits.length;
    const leasedBldUnits = bldUnits.filter(u => u.status === "leased").length;
    const rate = totalBldUnits > 0 ? Math.round((leasedBldUnits / totalBldUnits) * 100) : 0;
    return {
      name: b.name,
      "Tingkat Okupansi (%)": rate,
      "Total Unit": totalBldUnits,
      "Disewa": leasedBldUnits
    };
  });

  // 2. Financial Collections Structure Pie Chart
  const financialStatusData = [
    { name: "Terbayar (Paid)", value: collectedPaymentsSum, color: "#10b981" },
    { name: "Terlambat (Overdue)", value: overduePaymentsSum, color: "#f43f5e" },
    { name: "Menunggu (Pending)", value: pendingPaymentsSum, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  // 3. Simulated Monthly growth trend
  const growthTrendData = [
    { bulan: "Jan 26", pendapatan: 180000000 },
    { bulan: "Feb 26", pendapatan: 195000000 },
    { bulan: "Mar 26", pendapatan: 210000000 },
    { bulan: "Apr 26", pendapatan: 215000000 },
    { bulan: "Mei 26", pendapatan: 232500000 },
    { bulan: "Jun 26", pendapatan: totalRevenue || 232500000 }
  ];

  const formatRupiah = (num: number) => {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)} M`;
    }
    return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Bento Box Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Okupansi Portofolio</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">{portfolioOccupancyRate}%</h3>
            </div>
            <div className="bg-cyan-950/60 p-2.5 rounded-lg border border-cyan-900/40 text-cyan-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +4.2%
            </span>
            dr bulan lalu
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Sewa Berjalan (ARR)</p>
              <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-1">Rp {(totalRevenue * 12).toLocaleString("id-ID")}</h3>
            </div>
            <div className="bg-cyan-950/60 p-2.5 rounded-lg border border-cyan-900/40 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-[11px] text-slate-400 mt-4">
            Total pendapatan diproyeksikan per tahun
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Kolektabilitas Sewa</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {collectedPaymentsSum + overduePaymentsSum > 0 
                  ? `${Math.round((collectedPaymentsSum / (collectedPaymentsSum + overduePaymentsSum)) * 100)}%` 
                  : "100%"}
              </h3>
            </div>
            <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-900/40 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-[11px] text-slate-400 mt-4">
            Rasio invoice terbayar vs tertunggak
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Unit Kosong (Leasable)</p>
              <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">{emptyUnitsCount} Suite</h3>
            </div>
            <div className="bg-rose-950/60 p-2.5 rounded-lg border border-rose-900/40 text-rose-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-[11px] text-slate-400 mt-4">
            Tersedia untuk disewakan segera
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                Tingkat Okupansi per Gedung
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Rasio unit disewakan terhadap kapasitas total.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded font-sans">
              TIFA Target: 85%
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontStyle="sans" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: "12px" }}
                  itemStyle={{ color: "#22d3ee", fontSize: "11px" }}
                />
                <Bar dataKey="Tingkat Okupansi (%)" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {occupancyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#06b6d4" : "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection pie chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
              Status Kolektabilitas Keuangan (Collection Structure)
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Struktur pembagian total invoice pembayaran sewa terkumpul vs tertunggak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-60 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {financialStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "11px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {financialStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue growth trend line */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
            Tren Pendapatan Sewa Bulanan (Semester 1 - 2026)
          </h3>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Grafik akumulasi pendapatan sewa operasional terkonsolidasi dari 4 gedung.
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bulan" stroke="#64748b" fontSize={11} fontStyle="sans" />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rp ${val / 1000000} Jt`} />
              <Tooltip 
                formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                labelStyle={{ color: "#fff", fontWeight: "bold" }}
                itemStyle={{ color: "#22d3ee", fontSize: "11px" }}
              />
              <Line type="monotone" dataKey="pendapatan" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
