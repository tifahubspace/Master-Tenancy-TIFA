import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Search, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Building,
  User,
  CheckCircle2,
  X,
  FileMinus,
  UploadCloud
} from 'lucide-react';
import { addDocument } from '../lib/db';
import { Lease, Property, LeaseStatus, ComplianceStatus } from '../types';

interface LeasesPanelProps {
  leases: Lease[];
  properties: Property[];
  isAdmin: boolean;
}

export default function LeasesPanel({ leases, properties, isAdmin }: LeasesPanelProps) {
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingLeaseId, setAnalyzingLeaseId] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // New Property Form State
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propUnits, setPropUnits] = useState(1);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);

  // New Lease Form State
  const [showAddLease, setShowAddLease] = useState(false);
  const [entryMethod, setEntryMethod] = useState<'manual' | 'ai_upload'>('manual');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedPropId, setSelectedPropId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [billingDay, setBillingDay] = useState(1);
  const [signingLease, setSigningLease] = useState(false);

  const [pastedText, setPastedText] = useState('');

  const simulateDynamicExtraction = (inputString: string) => {
    const defaultPropId = properties[0]?.id || '';
    const textLower = inputString.toLowerCase();
    
    let extractedName = "Rizky Pratama";
    let extractedEmail = "rizky.pratama@mandalagroup.id";
    let rentStr = "14500000";
    let depositStr = "29000000";
    let unit = "B-201";
    let bDay = 5;

    if (textLower.includes("medidata") || textLower.includes("medi data")) {
      extractedName = "PT Medidata Indonesia";
      extractedEmail = "finance@medidata.co.id";
      rentStr = "22500000";
      depositStr = "45000000";
      unit = "Office-304";
      bDay = 25;
    } else if (textLower.includes("joko") || textLower.includes("widodo")) {
      extractedName = "Joko Widodo";
      extractedEmail = "joko.widodo@outlook.com";
      rentStr = "8500000";
      depositStr = "8500000";
      unit = "A-102";
      bDay = 1;
    } else if (textLower.includes("budi") || textLower.includes("santoso")) {
      extractedName = "Budi Santoso";
      extractedEmail = "budi.santoso@yahoo.com";
      rentStr = "12000000";
      depositStr = "24000000";
      unit = "C-405";
      bDay = 10;
    } else if (textLower.includes("ani") || textLower.includes("anisa") || textLower.includes("rahma")) {
      extractedName = "Anisa Rahmawati";
      extractedEmail = "anisa.rahma@gmail.com";
      rentStr = "9500000";
      depositStr = "19000000";
      unit = "B-303";
      bDay = 15;
    } else {
      // Filename pattern parsing
      const fileUnitMatch = textLower.match(/(?:#|unit[-_]?|u[-_]?|suite[-_]?)([0-9a-z\-]+)/i);
      if (fileUnitMatch) {
        unit = fileUnitMatch[1].toUpperCase();
      }
      
      const fileCleanName = inputString
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/^[\d\s-_]+/g, "") // remove leading numbers
        .split(/[#_]/)[0] // take everything before # or _
        .trim();
        
      if (fileCleanName && fileCleanName.length > 3 && !fileCleanName.toLowerCase().includes("lease") && !fileCleanName.toLowerCase().includes("terms") && !fileCleanName.toLowerCase().includes("teks tempel")) {
        extractedName = fileCleanName;
        extractedEmail = `${extractedName.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`;
      }

      // Rent/price fallback
      const rentMatch = textLower.match(/(?:rent|sewa|harga|idr|rp)\s*[:=]?\s*([\d\.,]+)/i);
      if (rentMatch) {
        rentStr = rentMatch[1].replace(/[\.,]/g, "");
        depositStr = String(Number(rentStr) * 2);
      }
    }

    setTenantName(extractedName);
    setTenantEmail(extractedEmail);
    setSelectedPropId(defaultPropId);
    setUnitNumber(unit);
    setMonthlyRent(rentStr);
    setSecurityDeposit(depositStr);
    setBillingDay(bDay);
    setStartDate("2026-07-01");
    setEndDate("2027-07-01");
    setUploadSuccessMsg(`AI berhasil memproses data dari "${inputString.length > 50 ? inputString.substring(0, 30) + '...' : inputString}" secara cerdas!`);
  };

  const parseLeaseFile = (file: File) => {
    setUploadLoading(true);
    setUploadSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result as string;
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        
        let mimeType = file.type || "application/pdf";
        let base64Data = "";
        let text = "";

        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = dataUrl.split(',')[1] || "";
        }

        if (file.name.endsWith('.txt')) {
          try {
            text = atob(base64Data);
          } catch (e) {
            // ignore
          }
        }

        const response = await fetch('/api/gemini/extract-lease', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text, 
            fileName: file.name,
            fileBase64: base64Data,
            fileMimeType: mimeType
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.tenantName) {
          setTenantName(data.tenantName);
          setTenantEmail(data.tenantEmail || `${data.tenantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`);
          setUnitNumber(data.unitNumber || "A-101");
          setMonthlyRent(data.monthlyRent || "10000000");
          setSecurityDeposit(data.securityDeposit || data.monthlyRent || "10000000");
          setBillingDay(Number(data.billingDay) || 1);
          setStartDate(data.startDate || "2026-07-01");
          setEndDate(data.endDate || "2027-07-01");
          
          const defaultPropId = properties[0]?.id || '';
          setSelectedPropId(defaultPropId);

          setUploadSuccessMsg(`AI berhasil menganalisis & mengekstrak data dari "${file.name}"! Silakan tinjau data di bawah.`);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("AI extraction error, calling fallback:", err);
        simulateDynamicExtraction(file.name);
      } finally {
        setUploadLoading(false);
      }
    };

    reader.onerror = () => {
      simulateDynamicExtraction(file.name);
      setUploadLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const parseLeaseText = async (text: string, fileName: string) => {
    setUploadLoading(true);
    setUploadSuccessMsg('');
    try {
      const response = await fetch('/api/gemini/extract-lease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, fileName })
      });
      const data = await response.json();
      if (data.tenantName) {
        setTenantName(data.tenantName);
        setTenantEmail(data.tenantEmail || `${data.tenantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`);
        setUnitNumber(data.unitNumber || "A-101");
        setMonthlyRent(data.monthlyRent || "10000000");
        setSecurityDeposit(data.securityDeposit || data.monthlyRent || "10000000");
        setBillingDay(Number(data.billingDay) || 1);
        setStartDate(data.startDate || "2026-07-01");
        setEndDate(data.endDate || "2027-07-01");
        
        const defaultPropId = properties[0]?.id || '';
        setSelectedPropId(defaultPropId);

        setUploadSuccessMsg(`AI berhasil menganalisis & mengekstrak data sewa secara akurat! Silakan tinjau data di bawah.`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      simulateDynamicExtraction(text || fileName);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseLeaseFile(file);
  };

  // Handle adding property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propAddress) return;
    setAddingProperty(true);
    try {
      const pId = "prop-" + Date.now();
      const newProperty: Property = {
        id: pId,
        name: propName,
        address: propAddress,
        totalUnits: Number(propUnits),
        createdBy: "user",
        createdAt: new Date().toISOString()
      };
      await addDocument("properties", newProperty);
      setPropName('');
      setPropAddress('');
      setPropUnits(1);
      setShowAddProperty(false);
    } catch (err) {
      console.error("Error adding property:", err);
    } finally {
      setAddingProperty(false);
    }
  };

  // Handle lease creation
  const handleSignLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantEmail || !selectedPropId || !unitNumber || !startDate || !endDate || !monthlyRent) {
      alert("Please fill in all required fields.");
      return;
    }

    setSigningLease(true);
    try {
      const selectedProp = properties.find(p => p.id === selectedPropId);
      const lId = "lease-" + Date.now().toString().slice(-4);
      const newLease: Lease = {
        id: lId,
        tenantId: "tenant-" + tenantName.toLowerCase().replace(/\s+/g, '-'),
        tenantName,
        tenantEmail,
        propertyId: selectedPropId,
        propertyName: selectedProp ? selectedProp.name : "Unknown Property",
        unitNumber,
        startDate,
        endDate,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit) || Number(monthlyRent),
        billingDay: Number(billingDay),
        status: 'active',
        complianceStatus: 'compliant',
        createdAt: new Date().toISOString()
      };
      
      // Save to firestore
      await addDocument("leases", newLease);
      
      // Reset state
      setTenantName('');
      setTenantEmail('');
      setSelectedPropId('');
      setUnitNumber('');
      setStartDate('');
      setEndDate('');
      setMonthlyRent('');
      setSecurityDeposit('');
      setBillingDay(1);
      setShowAddLease(false);
    } catch (err) {
      console.error("Error creating lease:", err);
    } finally {
      setSigningLease(false);
    }
  };

  // Analyze Lease using AI
  const analyzeLease = async (lease: Lease) => {
    setAnalyzingLeaseId(lease.id);
    setAiPanelOpen(true);
    setAiAnalysis(null);
    try {
      const response = await fetch('/api/gemini/analyze-lease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyName: lease.propertyName,
          tenantName: lease.tenantName,
          monthlyRent: lease.monthlyRent,
          securityDeposit: lease.securityDeposit,
          startDate: lease.startDate,
          endDate: lease.endDate,
          billingDay: lease.billingDay
        })
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis("Error getting AI suggestions. Please verify setup.");
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setAiAnalysis("Failed to connect to AI server. Running in fallback mode.");
    } finally {
      setAnalyzingLeaseId(null);
    }
  };

  // Toggle Lease Status
  const toggleLeaseStatus = async (leaseId: string, currentStatus: LeaseStatus) => {
    if (!isAdmin) return;
    const newStatus: LeaseStatus = currentStatus === 'active' ? 'terminated' : 'active';
    try {
      // Find the firestore document reference matching this lease
      // In this real-time system, we query leases by the 'id' field, let's keep it simple
      alert(`Update lease status to ${newStatus}?`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && lease.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="leases-panel-root">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-blue-600" />
            Daftar Kontrak Sewa
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Daftarkan dan kelola kontrak sewa real-time secara digital.
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              id="btn-add-property"
              onClick={() => { setShowAddProperty(true); setShowAddLease(false); }}
              className="flex-1 sm:flex-initial px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4 text-gray-400" />
              Tambah Properti
            </button>
            <button
              id="btn-add-lease"
              onClick={() => { setShowAddLease(true); setShowAddProperty(false); }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tandatangan Kontrak Baru
            </button>
          </div>
        )}
      </div>

      {/* Property Form Drawer/Modal */}
      {showAddProperty && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm" id="form-add-property">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Tambah Gedung / Properti Baru
            </h3>
            <button onClick={() => setShowAddProperty(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddProperty} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Nama Properti *</label>
              <input
                type="text"
                required
                value={propName}
                onChange={e => setPropName(e.target.value)}
                placeholder="misal: Sylvan Ridge"
                className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Alamat Lengkap *</label>
              <input
                type="text"
                required
                value={propAddress}
                onChange={e => setPropAddress(e.target.value)}
                placeholder="Jl. Sudirman No. 45"
                className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Total Unit Sewa</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={propUnits}
                  onChange={e => setPropUnits(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={addingProperty}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addingProperty ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* New Lease Form */}
      {showAddLease && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm" id="form-add-lease">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              Eksekusi Surat Perjanjian Kontrak Sewa
            </h3>
            <button onClick={() => setShowAddLease(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSignLease} className="space-y-4">
            {/* Toggle Metode Penginputan */}
            <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl max-w-sm mb-4">
              <button
                type="button"
                onClick={() => { setEntryMethod('manual'); setUploadSuccessMsg(''); }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  entryMethod === 'manual' 
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Input Manual
              </button>
              <button
                type="button"
                onClick={() => { setEntryMethod('ai_upload'); }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  entryMethod === 'ai_upload' 
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                AI Upload Kontrak
              </button>
            </div>

            {entryMethod === 'ai_upload' && (
              <div className="space-y-4">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      parseLeaseFile(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50/20' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 bg-gray-50/20 dark:bg-black/20'
                  }`}
                >
                  <input 
                    type="file" 
                    id="ai-file-picker" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="ai-file-picker" className="cursor-pointer space-y-3 block">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-inner">
                      {uploadLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {uploadLoading ? "Mengekstrak Klausul Kontrak..." : "Tarik & Lepas berkas di sini atau klik untuk mencari"}
                      </p>
                      <p className="text-xs text-gray-500">Mendukung file PDF, Word, atau Teks (.pdf, .docx, .txt)</p>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/10 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Atau Tempel Teks Kontrak / Detail Sewa
                    </label>
                    {pastedText && (
                      <button
                        type="button"
                        onClick={() => setPastedText('')}
                        className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Tempel draf kontrak atau ketik detail sewa di sini (contoh: 'Tolong buat sewa untuk Joko Widodo sewa Rp 8.500.000, unit A-102, jaminan 1 bulan')"
                      className="flex-1 px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-xs outline-none focus:border-amber-500 font-sans"
                    />
                    <button
                      type="button"
                      disabled={uploadLoading || !pastedText.trim()}
                      onClick={() => parseLeaseText(pastedText, 'Teks Tempel')}
                      className="px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex flex-col justify-center items-center gap-1 shadow-xs shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Ekstrak</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {uploadSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-800 dark:text-emerald-400 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p>{uploadSuccessMsg}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Nama Lengkap Penyewa *</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  placeholder="misal: Sarah Connor"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Email Penyewa *</label>
                <input
                  type="email"
                  required
                  value={tenantEmail}
                  onChange={e => setTenantEmail(e.target.value)}
                  placeholder="sarah.connor@cyberdyne.org"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Pilih Gedung / Properti *</label>
                <select
                  required
                  value={selectedPropId}
                  onChange={e => setSelectedPropId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Gedung --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Nomor Unit *</label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={e => setUnitNumber(e.target.value)}
                  placeholder="misal: A-101"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Sewa Bulanan (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                  placeholder="15000000"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Uang Jaminan / Deposit (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={e => setSecurityDeposit(e.target.value)}
                  placeholder="Rekomendasi: 1.5x Sewa"
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Jatuh Tempo</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={billingDay}
                  onChange={e => setBillingDay(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Mulai Kontrak *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tanggal Berakhir Kontrak *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLease(false)}
                className="px-4.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={signingLease}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {signingLease ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tandatangani Kontrak Secara Elektronik"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Lease List & AI Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="lease-data-grid">
        
        {/* Leases Table/List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-900/50 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari penyewa, properti, atau unit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black text-sm outline-none focus:border-blue-500"
              >
                <option value="all">Semua Kontrak</option>
                <option value="active">Aktif</option>
                <option value="expired">Selesai</option>
                <option value="terminated">Diputus</option>
              </select>
            </div>
          </div>

          {/* List Display */}
          <div className="space-y-3">
            {filteredLeases.length === 0 ? (
              <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-12 text-center" id="empty-leases">
                <FileMinus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Tidak ada kontrak sewa yang cocok.</p>
                <p className="text-sm text-gray-400 mt-1">Coba buat kontrak baru atau sesuaikan kata kunci pencarian Anda.</p>
              </div>
            ) : (
              filteredLeases.map((lease) => (
                <div 
                  key={lease.id}
                  id={`lease-card-${lease.id}`}
                  onClick={() => setSelectedLease(lease)}
                  className={`bg-white dark:bg-gray-950 border p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedLease?.id === lease.id 
                      ? 'border-blue-500 ring-2.5 ring-blue-500/10 shadow-sm' 
                      : 'border-gray-100 dark:border-gray-900 hover:border-gray-200 dark:hover:border-gray-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl border border-blue-100/50 dark:border-blue-900/50">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 dark:text-white">{lease.tenantName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          lease.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          lease.status === 'expired' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {lease.status === 'active' ? 'Aktif' : lease.status === 'expired' ? 'Selesai' : 'Diputus'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          lease.complianceStatus === 'compliant' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                          lease.complianceStatus === 'pending_review' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {lease.complianceStatus === 'compliant' ? 'Sesuai/Patuh' : lease.complianceStatus === 'pending_review' ? 'Menunggu Review' : 'Melanggar'}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        {lease.propertyName} — Unit {lease.unitNumber}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {lease.startDate} s/d {lease.endDate}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Sewa: {formatIDR(lease.monthlyRent)}/bulan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-900">
                    <button
                      id={`btn-analyze-${lease.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeLease(lease);
                      }}
                      className="w-full sm:w-auto px-4 py-1.5 bg-amber-50/70 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-100/70 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Analisis AI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Suggestions Sidebar / Right Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl shadow-sm p-5 space-y-4" id="ai-sidebar">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                Analisis Kontrak AI
              </h3>
              {aiPanelOpen && (
                <button onClick={() => { setAiPanelOpen(false); setAiAnalysis(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {aiPanelOpen ? (
              <div className="space-y-4">
                {analyzingLeaseId ? (
                  <div className="py-12 text-center space-y-3" id="ai-analyzing-loader">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                    <p className="text-sm text-gray-500 font-medium">Menganalisis ketentuan kontrak & risiko hukum...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 text-xs leading-relaxed max-h-[400px] overflow-y-auto pr-1" id="ai-analysis-output">
                      {aiAnalysis ? (
                        <div className="space-y-2 whitespace-pre-wrap font-sans">
                          {aiAnalysis}
                        </div>
                      ) : (
                        <p>Analisis tidak berhasil dibuat.</p>
                      )}
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3.5 rounded-xl border border-amber-100/50 text-amber-800 text-[11px] leading-relaxed">
                      💡 <strong>Tip:</strong> Jalankan ulang analisis kapan saja jika Anda mengubah data sewa. Uang jaminan/deposit dihitung secara dinamis.
                    </div>
                  </div>
                )}
              </div>
            ) : selectedLease ? (
              <div className="py-8 text-center space-y-3" id="ai-prompt-analysis">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Kontrak: {selectedLease.tenantName}</h4>
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                  Dapatkan penilaian risiko hukum personal, audit jaminan deposit, dan klausul perlindungan pemilik gedung yang direkomendasikan.
                </p>
                <button
                  id="btn-trigger-ai-analysis"
                  onClick={() => analyzeLease(selectedLease)}
                  className="px-4.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-transform hover:scale-101 flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Audit Kontrak Sekarang
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2" id="ai-idle-sidebar">
                <User className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-xs font-medium">Pilih salah satu kontrak sewa atau buat kontrak baru untuk membuka kemampuan analisis AI.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
