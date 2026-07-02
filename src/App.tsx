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
  RefreshCw
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, ensureAuthenticated, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { subscribeToCollection, addDocument, getDbMode, setDbMode, seedFirestoreIfEmpty } from './lib/db';
import { Property, Lease, Payment, Compliance, PortfolioStats } from './types';

// Import Modular Panels
import DashboardStats from './components/DashboardStats';
import LeasesPanel from './components/LeasesPanel';
import PaymentsPanel from './components/PaymentsPanel';
import CompliancePanel from './components/CompliancePanel';
import AIInsightsPanel from './components/AIInsightsPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(true); // Switch between Building Manager (Admin) & Tenant
  const [activeTab, setActiveTab] = useState<'overview' | 'leases' | 'payments' | 'compliance' | 'ai'>('overview');
  const [initializing, setInitializing] = useState(true);

  // Firestore Real-time Collections State
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [compliance, setCompliance] = useState<Compliance[]>([]);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // 1. Authenticate & Seed Database
  useEffect(() => {
    const activeMode = getDbMode();
    if (activeMode === "sandbox") {
      setUser({
        uid: "sandbox-guest",
        email: "guest@sandbox.pro",
        displayName: "Sandbox Guest"
      } as User);
      setInitializing(false);
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
          // No user (e.g., anonymous is disabled and not logged in with Google)
          setUser(null);
        }
      } catch (err) {
        console.error("Firebase Initialization Error:", err);
      } finally {
        setInitializing(false);
      }
    };

    setupAuthAndSeed();

    authUnsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => authUnsubscribe();
  }, []);

  // 2. Real-time Database Sync Listeners
  useEffect(() => {
    if (initializing || !user) return;

    // Listen to Properties
    const unsubProps = subscribeToCollection<Property>("properties", (list) => {
      setProperties(list);
    });

    // Listen to Leases
    const unsubLeases = subscribeToCollection<Lease>("leases", (list) => {
      setLeases(list);
    });

    // Listen to Payments
    const unsubPayments = subscribeToCollection<Payment>("payments", (list) => {
      setPayments(list);
    });

    // Listen to Compliance
    const unsubCompliance = subscribeToCollection<Compliance>("compliance", (list) => {
      setCompliance(list);
    });

    return () => {
      unsubProps();
      unsubLeases();
      unsubPayments();
      unsubCompliance();
    };
  }, [initializing, user]);

  // 3. Compute Real-time Dashboard Portfolio Statistics
  const stats: PortfolioStats = React.useMemo(() => {
    const totalLeases = leases.length;
    const activeLeases = leases.filter(l => l.status === 'active').length;

    // Payments
    const totalRentReceivable = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRentCollected = payments
      .filter(p => p.status === 'paid' || p.status === 'late' || p.status === 'partial')
      .reduce((sum, p) => {
        if (p.status === 'partial') return sum + (p.amount * 0.5); // Estimate partial paid as 50%
        return sum + p.amount;
      }, 0);
    const totalRentOutstanding = Math.max(0, totalRentReceivable - totalRentCollected);

    // Compliance
    const totalComplianceCases = compliance.length;
    const activeComplianceCases = compliance.filter(c => c.status !== 'resolved').length;
    const nonCompliantCount = leases.filter(l => l.complianceStatus === 'non_compliant').length;

    // Compliance score is percentage of compliant leases
    const complianceRate = totalLeases > 0 
      ? Math.round(((totalLeases - nonCompliantCount) / totalLeases) * 100)
      : 100;

    return {
      totalLeases,
      activeLeases,
      totalRentReceivable,
      totalRentCollected,
      totalRentOutstanding,
      complianceRate,
      nonCompliantCount,
      totalComplianceCases,
      activeComplianceCases
    };
  }, [leases, payments, compliance]);

  // 4. Real-time Event Simulator
  const runSimulationEvent = async () => {
    setSimulating(true);
    try {
      const eventType = Math.floor(Math.random() * 3); // 0: rent payment, 1: noise violation, 2: deposit paid
      
      if (eventType === 0 && leases.length > 0) {
        // Pick a random active lease
        const activeList = leases.filter(l => l.status === 'active');
        if (activeList.length === 0) return;
        const randomLease = activeList[Math.floor(Math.random() * activeList.length)];

        const amountPaid = randomLease.monthlyRent;
        const payId = "pay-sim-" + Date.now().toString().slice(-4);
        
        const simPayment: Payment = {
          id: payId,
          leaseId: randomLease.id,
          tenantId: randomLease.tenantId,
          tenantName: randomLease.tenantName,
          propertyId: randomLease.propertyId,
          propertyName: randomLease.propertyName,
          unitNumber: randomLease.unitNumber,
          amount: amountPaid,
          dueDate: new Date().toISOString().split('T')[0],
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          method: 'bank_transfer',
          notes: "Automated simulation payment posted via landlord portal.",
          createdAt: new Date().toISOString()
        };

        await addDocument("payments", simPayment);
        addSimLog(`💰 Rent payment posted: $${amountPaid} received from ${randomLease.tenantName} (Unit ${randomLease.unitNumber})`);
      } 
      else if (eventType === 1 && leases.length > 0) {
        // File noise violation
        const activeList = leases.filter(l => l.status === 'active');
        if (activeList.length === 0) return;
        const randomLease = activeList[Math.floor(Math.random() * activeList.length)];

        const compId = "comp-sim-" + Date.now().toString().slice(-4);
        const simCompliance: Compliance = {
          id: compId,
          leaseId: randomLease.id,
          tenantId: randomLease.tenantId,
          tenantName: randomLease.tenantName,
          propertyId: randomLease.propertyId,
          propertyName: randomLease.propertyName,
          unitNumber: randomLease.unitNumber,
          category: 'noise',
          severity: 'medium',
          status: 'under_review',
          details: "Automated real-time event simulation: Neighbors reported sudden loud music during evening hours.",
          reportedBy: "Real-time Simulator",
          dateReported: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };

        await addDocument("compliance", simCompliance);
        addSimLog(`🚨 Compliance warning: Filed Quiet Enjoyment violation for ${randomLease.tenantName} (Unit ${randomLease.unitNumber})`);
      }
      else {
        addSimLog("ℹ️ Real-time environment is idle. Ready for manual entry.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const addSimLog = (msg: string) => {
    setSimulationLogs(prev => [msg, ...prev.slice(0, 9)]);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setDbMode("firebase");
      window.location.reload();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      alert("Google Sign-In failed or was blocked. Please try using Sandbox Mode!");
    }
  };

  const handleUseSandbox = () => {
    setDbMode("sandbox");
    window.location.reload();
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center space-y-4" id="global-loader">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Connecting to Master Tenancy Vault...</h2>
          <p className="text-sm text-gray-500 mt-1">Bootstrapping database structures & cloud indexes...</p>
        </div>
      </div>
    );
  }

  // Render pristine Gatekeeper Login Screen if user is unauthenticated in Firestore Mode
  if (!user) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100" id="login-screen">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-850 p-8 rounded-lg shadow-2xl relative overflow-hidden space-y-6" id="login-card">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">Master Tenancy Gateway</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Real-time lease auditing, financial compliance, and legal monitoring operations console.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-950/40 rounded p-4 text-[11px] space-y-1.5 font-mono text-slate-400">
            <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Security Information:</p>
            <p>• Access requires an active Google Workspace account.</p>
            <p>• Unauthorized attempts are audited under sovereign property statutes.</p>
            <p>• Sandbox bypass enables in-memory isolated workspace testing.</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              id="btn-login-google"
              onClick={handleGoogleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/10 uppercase tracking-wider"
            >
              <span>Sign In with Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider py-1">
              <span className="h-px bg-slate-800 flex-1"></span>
              <span className="px-3">or bypass login</span>
              <span className="h-px bg-slate-800 flex-1"></span>
            </div>

            <button
              id="btn-bypass-sandbox"
              onClick={handleUseSandbox}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-2.5 px-4 rounded font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700 uppercase tracking-wider"
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>Use Local Demo Sandbox</span>
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-600 font-mono tracking-tight pt-2">
            SECURE V4.1.14 // SYSTEM OPERATIONAL
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-screen h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden dark:bg-slate-950 dark:text-slate-100" id="app-root">
      
      {/* Left Sidebar */}
      <aside className="w-56 bg-slate-900 flex flex-col h-full flex-shrink-0 text-slate-400 border-r border-slate-800" id="app-sidebar">
        {/* Logo block */}
        <div className="p-5 flex items-center space-x-2 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow">
            <span>MT</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-tight flex items-center gap-1">
              MasterTenancy
              <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">PRO</span>
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="mt-4 flex-1 overflow-y-auto space-y-1">
          <div className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Manajemen</div>
          
          <button 
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'overview' 
                ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                : 'text-slate-400 hover:text-white border-l-4 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-3 opacity-50 font-mono text-[10px]">01</span>
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Dashboard
          </button>

          <button 
            id="tab-leases"
            onClick={() => setActiveTab('leases')}
            className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'leases' 
                ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                : 'text-slate-400 hover:text-white border-l-4 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-3 opacity-50 font-mono text-[10px]">02</span>
            <FileText className="w-3.5 h-3.5 mr-2" />
            Kontrak Sewa ({leases.length})
          </button>

          <button 
            id="tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'payments' 
                ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                : 'text-slate-400 hover:text-white border-l-4 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-3 opacity-50 font-mono text-[10px]">03</span>
            <DollarSign className="w-3.5 h-3.5 mr-2" />
            Buku Kas Sewa ({payments.length})
          </button>

          <button 
            id="tab-compliance"
            onClick={() => setActiveTab('compliance')}
            className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'compliance' 
                ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                : 'text-slate-400 hover:text-white border-l-4 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-3 opacity-50 font-mono text-[10px]">04</span>
            <AlertTriangle className="w-3.5 h-3.5 mr-2" />
            Kepatuhan Tenant ({compliance.length})
          </button>

          <div className="px-5 py-2 pt-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sistem AI</div>

          <button 
            id="tab-ai-advisor"
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'ai' 
                ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                : 'text-slate-400 hover:text-white border-l-4 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <span className="mr-3 opacity-50 font-mono text-[10px]">05</span>
            <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" />
            Briefing Strategis AI
          </button>

          <div className="px-5 py-2 pt-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Portofolio</div>
          <div className="px-5 py-1 text-[11px] text-slate-600 italic flex items-center">
            <Building2 className="w-3 h-3 mr-2" /> {properties.length} Properti Sinkron
          </div>
        </nav>

        {/* Database Status and Switcher */}
        <div className="mx-4 my-3 p-3 bg-slate-950/40 rounded border border-slate-800/80 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold tracking-tight text-[10px] font-mono">STATUS MESIN:</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
              getDbMode() === "firebase" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {getDbMode() === "firebase" ? "Firestore" : "Sandbox"}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            {getDbMode() === "firebase" 
              ? "Berjalan dalam mode sinkronisasi cloud langsung." 
              : "Berjalan lokal dalam sandbox browser offline-first."}
          </p>
          <button
            onClick={() => {
              const current = getDbMode();
              setDbMode(current === "firebase" ? "sandbox" : "firebase");
              window.location.reload();
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-1 px-2 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 border border-slate-700 uppercase tracking-wider"
          >
            <Database className="w-3 h-3 text-blue-400" />
            <span>Ganti ke {getDbMode() === "firebase" ? "Sandbox" : "Firestore"}</span>
          </button>
        </div>

        {/* User Card at the Bottom of Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold uppercase flex-shrink-0 shadow-inner">
              {isAdmin ? "AD" : "MG"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">
                {user?.displayName || (isAdmin ? "Admin Utama" : "Tim Manajemen")}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {isAdmin ? "Administrator" : "Management Role"}
              </div>
            </div>
          </div>
          {getDbMode() === "firebase" && (
            <button 
              onClick={() => {
                signOut(auth);
                window.location.reload();
              }}
              title="Keluar"
              className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* High Density Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between flex-shrink-0" id="app-header">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded text-[10px] font-mono tracking-wider font-bold">
              {isAdmin ? "AKSES // ADMINISTRATOR" : "AKSES // MANAGEMENT ROLE"}
            </div>
            
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${getDbMode() === 'firebase' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
              <span>{getDbMode() === 'firebase' ? 'Terhubung Cloud (Live Firestore)' : 'Penyimpanan Sandbox (Lokal-Only)'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Simulation button */}
            <button 
              id="btn-simulate-event"
              disabled={simulating}
              onClick={runSimulationEvent}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
              <span>Simulasikan Kejadian Real-Time</span>
            </button>

            {/* Switch Role Button */}
            <button
              id="btn-toggle-role"
              onClick={() => {
                setIsAdmin(!isAdmin);
                setActiveTab('overview');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ganti Peran ({isAdmin ? "Management" : "Admin"})</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Live Simulation Alert box (replaces the top banner bar nicely) */}
          {simulationLogs.length > 0 && (
            <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 p-3.5 rounded flex items-start gap-2.5 shadow-xs" id="simulation-logs-banner">
              <Bell className="w-4 h-4 text-blue-600 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Umpan Riwayat Kejadian Real-Time</p>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono space-y-0.5 leading-relaxed">
                  {simulationLogs.slice(0, 2).map((log, index) => (
                    <p key={index} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Switch board */}
          <div id="app-view-container">
            {activeTab === 'overview' && (
              <div className="space-y-6" id="overview-tab">
                {/* Dynamic KPI Cards */}
                <DashboardStats stats={stats} />

                {/* Bento Grid: Active Leases list + Critical Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Active Tenants List */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded shadow-sm">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-500" />
                          Direktori Hunian
                        </h3>
                        <p className="text-[10px] text-slate-400">Daftar kontrak sewa tenant yang sedang aktif.</p>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase">
                        {leases.filter(l => l.status === 'active').length} Aktif
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {leases.filter(l => l.status === 'active').length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-12">Tidak ada tenant aktif. Daftarkan kontrak sewa baru untuk memulai.</p>
                      ) : (
                        leases.filter(l => l.status === 'active').map(l => (
                          <div key={l.id} className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-100 dark:border-slate-800/80 flex justify-between items-center gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{l.tenantName}</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] font-medium">{l.propertyName} (Unit {l.unitNumber})</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-950 dark:text-slate-200">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(l.monthlyRent)}/bln
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Tagihan: Tanggal {l.billingDay}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Critical Compliance Warning Sidebar */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        Pemantauan Kepatuhan
                      </h3>
                      
                      <div className="space-y-2.5">
                        {compliance.filter(c => c.status !== 'resolved').length === 0 ? (
                          <div className="text-center py-10 space-y-2">
                            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Nol Pelanggaran Aktif</p>
                            <p className="text-[10px] text-slate-400">Semua tenant sepenuhnya patuh terhadap tata tertib gedung.</p>
                          </div>
                        ) : (
                          compliance.filter(c => c.status !== 'resolved').slice(0, 3).map(c => (
                            <div key={c.id} className="flex gap-2 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-ping"></span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-200">{c.tenantName} (Unit {c.unitNumber})</p>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] capitalize">Pelanggaran {c.category === 'noise' ? 'kebisingan' : c.category === 'maintenance' ? 'pemeliharaan' : 'lainnya'} — <span className="font-bold text-rose-600">{c.severity === 'high' ? 'Tinggi' : c.severity === 'medium' ? 'Sedang' : 'Rendah'}</span></p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Perpanjang otomatis aktif?</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        Ya
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'leases' && (
              <LeasesPanel 
                leases={leases} 
                properties={properties} 
                isAdmin={isAdmin} 
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsPanel 
                payments={payments} 
                leases={leases} 
                isAdmin={isAdmin} 
              />
            )}

            {activeTab === 'compliance' && (
              <CompliancePanel 
                compliance={compliance} 
                leases={leases} 
                isAdmin={isAdmin} 
              />
            )}

            {activeTab === 'ai' && (
              <AIInsightsPanel 
                leases={leases} 
                payments={payments} 
                compliance={compliance} 
              />
            )}
          </div>

          {/* Compact visual footer */}
          <footer className="text-left text-[11px] text-slate-400/90 py-4 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center flex-wrap gap-2">
            <p>© 2026 Master Tenancy, Inc. High Density Audit Platform.</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Firestore Synced
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gemini AI Auditing
              </span>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
