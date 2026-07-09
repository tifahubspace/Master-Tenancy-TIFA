import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Users, 
  LogOut, 
  Loader2, 
  Bell, 
  LayoutDashboard,
  Zap,
  CheckCircle,
  HelpCircle,
  Database,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, ensureAuthenticated, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { 
  subscribeToCollection, 
  addDocument, 
  getDbMode, 
  setDbMode, 
  seedFirestoreIfEmpty, 
  deleteDocument, 
  clearAllSandboxData,
  updateDocument
} from './lib/db';
import { 
  Building, 
  Floor, 
  Unit, 
  Tenant, 
  Lease, 
  Payment, 
  Document, 
  AuditLog, 
  ApprovalWorkflow, 
  Notification, 
  PortfolioStats 
} from './types';

// Import Modular Components & Panels
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import LeasesPanel from './components/LeasesPanel';
import PaymentsPanel from './components/PaymentsPanel';
import CompliancePanel from './components/CompliancePanel';
import AIInsightsPanel from './components/AIInsightsPanel';
import MasterDataManagement from './components/MasterDataManagement';
import AuditAndWorkflow from './components/AuditAndWorkflow';
import ReportsModule from './components/ReportsModule';
import AIContractIntelligence from './components/AIContractIntelligence';
import AIContractComparison from './components/AIContractComparison';
import AIAssistant from './components/AIAssistant';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initializing, setInitializing] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Core Firestore & Local Sandbox Entities State
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Simulation Logs
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    "Sistem TPMS Enterprise diinisialisasi.",
    "Buku kas & register properti berhasil dimuat secara real-time."
  ]);

  // AI Assistant Overlay Toggle
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Custom alert/confirm modal state
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert'
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  // 1. Initial Authentication Gatekeeper & Database Seeding
  useEffect(() => {
    const activeMode = getDbMode();
    
    if (activeMode === "sandbox") {
      setUser({
        uid: "sandbox-guest",
        email: "info@tifahub.space",
        displayName: "Super Administrator"
      } as User);
      setInitializing(false);
      return;
    }

    const bypassAuth = localStorage.getItem("db_bypass_auth") === "true";
    if (bypassAuth) {
      setUser({
        uid: "firebase-guest-bypass",
        email: "info@tifahub.space",
        displayName: "Super Administrator"
      } as User);

      const seedAndFinish = async () => {
        try {
          await seedFirestoreIfEmpty();
        } catch (err: any) {
          console.error(err);
          showAlert(
            "Koneksi Firestore Gagal",
            "Gagal melakukan sinkronisasi dengan database Firestore: " + (err.message || err) + ". Menggunakan Sandbox sebagai fallback aman."
          );
        } finally {
          setInitializing(false);
        }
      };
      seedAndFinish();
      return;
    }

    let authUnsubscribe = () => {};

    const setupAuthAndSeed = async () => {
      try {
        const authedUser = await ensureAuthenticated();
        if (authedUser) {
          setUser(authedUser);
          await seedFirestoreIfEmpty();
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error("Firebase Auth initialization error:", err);
        showAlert(
          "Koneksi Cloud Gagal",
          "Koneksi Firebase terhambat. Silakan gunakan 'Local Demo Sandbox' untuk pengalaman lancar."
        );
      } finally {
        setInitializing(false);
      }
    };

    setupAuthAndSeed();

    authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (localStorage.getItem("db_bypass_auth") === "true") return;
      setUser(u);
    });

    return () => authUnsubscribe();
  }, [refreshTrigger]);

  // 2. Real-time Reactive Subscriptions for All 10 Entities
  useEffect(() => {
    if (initializing || !user) return;

    const unsubBuildings = subscribeToCollection<Building>("buildings", (list) => {
      setBuildings(list);
    });

    const unsubFloors = subscribeToCollection<Floor>("floors", (list) => {
      setFloors(list);
    });

    const unsubUnits = subscribeToCollection<Unit>("units", (list) => {
      setUnits(list);
    });

    const unsubTenants = subscribeToCollection<Tenant>("tenants", (list) => {
      setTenants(list);
    });

    const unsubLeases = subscribeToCollection<Lease>("leases", (list) => {
      setLeases(list);
    });

    const unsubPayments = subscribeToCollection<Payment>("payments", (list) => {
      setPayments(list);
    });

    const unsubDocuments = subscribeToCollection<Document>("documents", (list) => {
      setDocuments(list);
    });

    const unsubAuditLogs = subscribeToCollection<AuditLog>("auditLogs", (list) => {
      setAuditLogs(list);
    });

    const unsubWorkflows = subscribeToCollection<ApprovalWorkflow>("approvalWorkflows", (list) => {
      setWorkflows(list);
    });

    const unsubNotifications = subscribeToCollection<Notification>("notifications", (list) => {
      setNotifications(list);
    });

    return () => {
      unsubBuildings();
      unsubFloors();
      unsubUnits();
      unsubTenants();
      unsubLeases();
      unsubPayments();
      unsubDocuments();
      unsubAuditLogs();
      unsubWorkflows();
      unsubNotifications();
    };
  }, [initializing, user, refreshTrigger]);

  // 3. Dynamic Calculation of Portfolio KPIs & Occupancy Metrics
  const stats: PortfolioStats = React.useMemo(() => {
    const totalBuildings = buildings.length;
    const totalFloors = floors.length;
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.status === 'leased').length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const totalTenants = tenants.length;
    const totalLeases = leases.length;
    const activeLeases = leases.filter(l => l.status === 'active').length;

    const monthlyRevenueEstimate = leases
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + l.monthlyRent, 0);

    const revenueCollected = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueOutstanding = payments
      .filter(p => p.status === 'overdue' || p.status === 'late' || p.status === 'partial')
      .reduce((sum, p) => {
        if (p.status === 'partial') return sum + (p.amount * 0.5);
        return sum + p.amount;
      }, 0);

    return {
      totalBuildings,
      totalFloors,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalTenants,
      totalLeases,
      activeLeases,
      monthlyRevenueEstimate,
      revenueCollected,
      revenueOutstanding
    };
  }, [buildings, floors, units, tenants, leases, payments]);

  // Trigger manual refresh
  const handleRefreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
    showAlert("Sukses", "Sinkronisasi data real-time berhasil diperbarui!");
  };

  const handleClearAllData = () => {
    showConfirm(
      "Format Seluruh Database",
      "Apakah Anda yakin ingin menghapus seluruh draf & master sewa? Tindakan ini bersifat permanen.",
      async () => {
        try {
          if (getDbMode() === "sandbox") {
            clearAllSandboxData();
            showAlert("Format Sukses", "Database Sandbox lokal telah dikosongkan.");
            setRefreshTrigger(prev => prev + 1);
          } else {
            // Firestore deletes
            for (const b of buildings) await deleteDocument("buildings", b.id);
            for (const l of leases) await deleteDocument("leases", l.id);
            for (const p of payments) await deleteDocument("payments", p.id);
            for (const w of workflows) await deleteDocument("approvalWorkflows", w.id);
            showAlert("Format Sukses", "Seluruh dokumen Cloud Firestore berhasil dibersihkan.");
            setRefreshTrigger(prev => prev + 1);
          }
        } catch (err: any) {
          showAlert("Gagal", "Format gagal: " + err.message);
        }
      }
    );
  };

  const runSimulationEvent = async () => {
    try {
      const activeLeasesList = leases.filter(l => l.status === 'active');
      if (activeLeasesList.length === 0) {
        showAlert("Simulation Info", "Tidak ada kontrak sewa aktif untuk disimulasikan. Daftarkan kontrak sewa baru terlebih dahulu!");
        return;
      }

      const randomLease = activeLeasesList[Math.floor(Math.random() * activeLeasesList.length)];
      const eventType = Math.floor(Math.random() * 2);

      if (eventType === 0) {
        // Rent Payment Posted
        const amountPaid = randomLease.monthlyRent;
        const payId = `pay-sim-${Date.now().toString().slice(-4)}`;
        const simPayment: Payment = {
          id: payId,
          leaseId: randomLease.id,
          tenantId: randomLease.tenantId,
          tenantName: randomLease.tenantName,
          buildingId: randomLease.buildingId,
          buildingName: randomLease.buildingName,
          unitNumber: randomLease.unitNumber,
          amount: amountPaid,
          dueDate: new Date().toISOString().split('T')[0],
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          method: 'bank_transfer',
          notes: "Pembayaran sewa otomatis dicatat oleh simulator sistem.",
          createdAt: new Date().toISOString()
        };

        await addDocument("payments", simPayment);
        setSimulationLogs(prev => [
          `💰 Transaksi Masuk: Pembayaran sewa sebesar Rp ${amountPaid.toLocaleString('id-ID')} diterima dari ${randomLease.tenantName} untuk Unit ${randomLease.unitNumber}`,
          ...prev.slice(0, 9)
        ]);
      } else {
        // New compliance alert
        const notifId = `notif-${Date.now()}`;
        await addDocument("notifications", {
          id: notifId,
          title: `Suhu / AC Unit ${randomLease.unitNumber} (${randomLease.tenantName})`,
          message: `Sensor gedung mendeteksi anomali suhu pendingin udara. Memerlukan perawatan terjadwal.`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          type: 'system'
        });
        setSimulationLogs(prev => [
          `🚨 Alert Kepatuhan: Sensor gedung mendeteksi masalah unit pendingin udara di unit ${randomLease.tenantName} (${randomLease.unitNumber})`,
          ...prev.slice(0, 9)
        ]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setDbMode("firebase");
      window.location.reload();
    } catch (err: any) {
      console.error("Google login failed:", err);
      showAlert("Login Gagal", "Pendaftaran Google Sign-In terhambat oleh kebijakan iFrame browser Anda. Silakan masuk via Sandbox Mode.");
    }
  };

  const handleUseFirestoreBypass = () => {
    setDbMode("firebase");
    localStorage.setItem("db_bypass_auth", "true");
    window.location.reload();
  };

  const handleUseSandbox = () => {
    setDbMode("sandbox");
    localStorage.removeItem("db_bypass_auth");
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      if (getDbMode() === "firebase") {
        await signOut(auth);
      }
      localStorage.removeItem("db_bypass_auth");
      localStorage.removeItem("db_mode");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4" id="global-loader">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-white font-sans tracking-wide">MENYELARASKAN DATA PORTAL...</h2>
          <p className="text-[11px] text-slate-500 font-mono">Memverifikasi indeks dokumen, struktur database, dan enkripsi kunci...</p>
        </div>
      </div>
    );
  }

  // Gateway screen
  if (!user) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100" id="login-screen">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))]"></div>
        
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden space-y-6" id="login-card">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500"></div>
          
          <div className="text-center space-y-2">
            <div className="w-11 h-11 bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-white uppercase font-sans">Gateway TPMS AI Enterprise</h1>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Konsol manajemen sewa multi-gedung, audit dokumen draf berbasis kecerdasan buatan, dan kontrol piutang sewa.
            </p>
          </div>

          <div className="border border-slate-800/60 bg-slate-950/60 rounded-xl p-4 text-[10px] space-y-1.5 font-mono text-slate-400">
            <p className="text-cyan-400 font-bold uppercase tracking-wider text-[9px]">Sistem Pengamanan:</p>
            <p>• Integrasi Google Drive & Dokumen Kontrak Sewa.</p>
            <p>• Sandbox Mode bekerja offline secara instan tanpa cloud.</p>
            <p>• Semua transaksi & dokumen diaudit berkala.</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Real-time Demo Local Sandbox Bypass */}
            <button
              id="btn-login-sandbox"
              onClick={handleUseSandbox}
              className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Mulai Sandbox Mode (Rekomendasi Instan)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-bypass-firestore"
              onClick={handleUseFirestoreBypass}
              className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Gunakan Database Firestore</span>
            </button>

            <button
              id="btn-login-google"
              onClick={handleGoogleSignIn}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Masuk dengan Google Auth</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const pendingApprovalsCount = workflows.filter(w => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100 antialiased" id="enterprise-main-shell">
      {/* 1. Sidebar Navigation Menu */}
      <Sidebar 
        currentTab={activeTab} 
        setCurrentTab={setActiveTab} 
        unreadCount={unreadNotificationsCount}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        
        {/* Top Control Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">WORKSPACE /</span>
            <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-widest">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="btn-trigger-simulator"
              onClick={runSimulationEvent}
              className="bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-850 text-cyan-400 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Simulasikan pembayaran masuk atau peringatan real-time"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Simulasi Event
            </button>

            <button
              id="btn-refresh-sync"
              onClick={handleRefreshAll}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 p-1.5 rounded-lg"
              title="Sinkronisasi Ulang Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* DB Mode indicator */}
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${getDbMode() === 'firebase' ? 'bg-emerald-500' : 'bg-cyan-500'} inline-block`}></span>
              {getDbMode() === 'firebase' ? 'Cloud Firestore' : 'Sandbox Mode'}
            </span>

            {/* Quick Toggle Admin/User */}
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-900"
            >
              Mode: {isAdmin ? "Manajemen" : "Penyewa"}
            </button>

            <button
              id="btn-global-signout"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-950/20 rounded-lg"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">
          
          {/* Active Tab Router */}
          <div id="app-view-container">
            {activeTab === 'dashboard' && (
              <div className="space-y-6" id="overview-tab">
                {/* Dynamic Portfolio Metrics */}
                <DashboardStats stats={stats} />

                {/* Bento Grid: Active Leases + Real-time Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Active Tenants List */}
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                        <div>
                          <h3 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans uppercase tracking-wide">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Direktori Hunian Komersial
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Daftar tenant dengan draf sewa aktif yang terdaftar di portofolio gedung.</p>
                        </div>
                        <span className="text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded uppercase">
                          {leases.filter(l => l.status === 'active').length} Kontrak Aktif
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {leases.filter(l => l.status === 'active').length === 0 ? (
                          <p className="text-slate-500 text-xs text-center py-16">Belum ada kontrak sewa aktif terdaftar.</p>
                        ) : (
                          leases.filter(l => l.status === 'active').map(l => (
                            <div key={l.id} className="p-3 bg-slate-950 rounded-lg border border-slate-850 flex justify-between items-center gap-4 text-xs">
                              <div>
                                <p className="font-bold text-white">{l.tenantName}</p>
                                <p className="text-slate-400 mt-0.5 text-[11px] font-medium">{l.buildingName} (Unit {l.unitNumber})</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-200">
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(l.monthlyRent)}/bln
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Tagihan: Tanggal {l.billingDay}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-850 mt-4 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Memuat database properti multi-gedung</span>
                      <button onClick={handleClearAllData} className="text-rose-500 hover:text-rose-400 font-bold">Format Database</button>
                    </div>
                  </div>

                  {/* Real-time logs and environment monitor */}
                  <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="font-bold text-white text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800 uppercase tracking-wide">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Log Kejadian Real-Time
                      </h3>
                      
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                        {simulationLogs.map((log, index) => (
                          <div key={index} className="flex items-start gap-2 text-[10px] font-mono leading-relaxed text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1 flex-shrink-0"></span>
                            <p>{log}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-850 mt-4 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-medium">Verifikasi berkas otomatis</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        Aktif
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Core & Operations Routing */}
            {activeTab === 'leases' && (
              <LeasesPanel 
                leases={leases} 
                buildings={buildings} 
                onRefresh={handleRefreshAll}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsPanel 
                payments={payments} 
                leases={leases} 
                onRefresh={handleRefreshAll}
              />
            )}

            {activeTab === 'approval_workflow' && (
              <AuditAndWorkflow 
                leases={leases}
                workflows={workflows}
                auditLogs={auditLogs}
                onRefresh={handleRefreshAll}
                activeSubTab="workflow"
              />
            )}

            {activeTab === 'reports' && (
              <ReportsModule 
                buildings={buildings}
                units={units}
                leases={leases}
                payments={payments}
              />
            )}

            {/* AI Intelligent Hub Routing */}
            {activeTab === 'contract_intelligence' && (
              <AIContractIntelligence 
                buildings={buildings}
                tenants={tenants}
                units={units}
                documents={documents}
                stats={stats}
                onRefresh={handleRefreshAll}
              />
            )}

            {activeTab === 'contract_comparison' && (
              <AIContractComparison />
            )}

            {/* Master Data Management Routing */}
            {['buildings', 'floors', 'units', 'tenants', 'documents'].includes(activeTab) && (
              <MasterDataManagement 
                buildings={buildings}
                floors={floors}
                units={units}
                tenants={tenants}
                documents={documents}
                selectedTab={activeTab}
                onRefresh={handleRefreshAll}
              />
            )}

            {/* Administration Routing */}
            {activeTab === 'users' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    Manajemen Pengguna & Hak Akses
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Mengelola lisensi operasional staf administrasi, keuangan, legalitas, serta akses eksekutif properti.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { name: "Ahmad Rizky", email: "rizky.ahmad@tpms.co.id", role: "Super Administrator", active: true },
                    { name: "Dewi Lestari", email: "dewi.lestari@tpms.co.id", role: "Finance Approver", active: true },
                    { name: "Hendri Setiawan", email: "hendri.s@tpms.co.id", role: "Legal Auditor", active: true },
                    { name: "Budi Jatmiko", email: "budi.j@alamanda.space", role: "Building Manager - Alamanda", active: false }
                  ].map((staff, sIdx) => (
                    <div key={sIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white">{staff.name}</h4>
                          <span className={`w-2 h-2 rounded-full ${staff.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{staff.email}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-indigo-400 font-bold">{staff.role}</span>
                        <span className="text-slate-500 font-mono">{staff.active ? 'AKTIF' : 'SUSPENDED'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audit_log' && (
              <AuditAndWorkflow 
                leases={leases}
                workflows={workflows}
                auditLogs={auditLogs}
                onRefresh={handleRefreshAll}
                activeSubTab="audit"
              />
            )}

            {activeTab === 'notifications' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-cyan-400" />
                      Pusat Pemberitahuan Sistem
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Daftar notifikasi otomatis terkait pelunasan piutang sewa, kedaluwarsa kontrak, dan pengajuan legal.</p>
                  </div>
                  <button 
                    onClick={() => {
                      notifications.forEach(n => updateDocument("notifications", n.id, { read: true }));
                      showAlert("Selesai", "Semua notifikasi telah ditandai sebagai dibaca.");
                    }}
                    className="text-xs text-cyan-400 font-semibold"
                  >
                    Tandai Semua Dibaca
                  </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-12">Belum ada notifikasi sistem masuk.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-lg border flex justify-between items-start gap-4 ${n.read ? 'bg-slate-950/60 border-slate-900 text-slate-400' : 'bg-slate-950 border-slate-800 text-white'}`}>
                        <div className="space-y-1">
                          <p className="text-xs font-bold flex items-center gap-1.5">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                            {n.title}
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-400">{n.message}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{n.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compact modern footer */}
          <footer className="text-left text-[11px] text-slate-500/90 py-6 border-t border-slate-900 flex justify-between items-center flex-wrap gap-2">
            <p>© 2026 TPMS AI Enterprise. Property & Lease Intelligence Console.</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                {getDbMode() === 'firebase' ? 'Cloud Firestore Synchronized' : 'Sandbox Storage Synchronized'}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Gemini AI 3.5 Engine
              </span>
            </div>
          </footer>

        </div>

        {/* 3. Floating Conversational Assistant Button */}
        <button
          id="btn-trigger-ai-chat"
          onClick={() => setAiAssistantOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-cyan-500/20 z-40 transition-transform hover:scale-105 active:scale-95"
          title="Buka Asisten AI Properti"
        >
          <MessageSquare className="w-5.5 h-5.5 text-white" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* AI Assistant Dialog Panel */}
        <AIAssistant 
          buildings={buildings}
          units={units}
          leases={leases}
          payments={payments}
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
        />

      </main>

      {/* Custom Modal Dialgos for warnings/confirmations */}
      {customModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{customModal.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{customModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              {customModal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setCustomModal(prev => ({ ...prev, isOpen: false }));
                      if (customModal.onConfirm) customModal.onConfirm();
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Ya, Lanjutkan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
