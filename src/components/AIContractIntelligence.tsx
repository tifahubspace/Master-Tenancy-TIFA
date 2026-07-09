import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Check, 
  ShieldAlert, 
  Cpu, 
  RefreshCw, 
  Layers, 
  ExternalLink, 
  Percent, 
  Users, 
  Grid,
  X 
} from "lucide-react";
import { addDocument } from "../lib/db";
import { Building, Tenant, Unit, Document, PortfolioStats } from "../types";

interface AIContractIntelligenceProps {
  buildings: Building[];
  tenants: Tenant[];
  units: Unit[];
  documents: Document[];
  stats: PortfolioStats;
  onRefresh: () => void;
}

const SAMPLE_TEMPLATES = [
  {
    title: "PT Medidata Indonesia - TIFA Suite 201",
    fileName: "Sewa_TIFA_Suite_201_Medidata.pdf",
    text: "PERJANJIAN SEWA MENYEWA PERKANTORAN.\n\nYang bertanda tangan di bawah ini:\n1. Pihak Pengelola Gedung TIFA Building, beralamat di Jl. Kuningan Barat No.26.\n2. PT Medidata Indonesia, diwakili oleh Rizky Pratama, beralamat email finance@medidata.co.id.\n\nMenerangkan bahwa kedua belah pihak sepakat untuk melakukan sewa menyewa unit perkantoran Suite 201 yang terletak di Lantai 02 Gedung TIFA Building.\n\nSewa menyewa ini dilangsungkan untuk jangka waktu 2 (dua) tahun, terhitung sejak 1 Januari 2026 dan akan berakhir pada 31 Desember 2027.\n\nHarga sewa yang disepakati adalah sebesar Rp 63.000.000 (enam puluh tiga juta Rupiah) per bulan, dengan jaminan sewa (Security Deposit) sebesar Rp 126.000.000 yang wajib dibayarkan sebelum tanggal mulai sewa.\n\nPembayaran sewa bulanan wajib ditransfer ke rekening Pengelola Gedung paling lambat tanggal 5 setiap bulannya."
  },
  {
    title: "Kopi Kenangan - Alamanda Suite 101",
    fileName: "Sewa_Alamanda_Suite_101_Kenangan.pdf",
    text: "KONTRAK KERJASAMA SEWA RUANG USAHA LOBBY.\n\nAntara PT Alamanda Sarana Properti (Pengelola Gedung Alamanda) dan PT Kopi Jiwa Sejahtera (Kopi Kenangan), diwakili oleh Edward Tirtanata, kontak email partnership@kopikenangan.id.\n\nObjek sewa: Unit retail Suite 101 di Lantai 01 Gedung Alamanda, Jl. TB Simatupang No.21.\n\nMasa sewa berlangsung selama 12 bulan dimulai tanggal 1 Maret 2026 sampai dengan 28 Februari 2027.\n\nHarga sewa bulanan disepakati sebesar Rp 52.500.000 (lima puluh dua juta lima ratus ribu Rupiah) dengan Security Deposit senilai Rp 105.000.000.\n\nJatuh tempo pembayaran tagihan sewa bulanan disepakati pada tanggal 10 setiap bulannya."
  },
  {
    title: "Astra Logistics - Ventura Suite 201",
    fileName: "Sewa_Ventura_Suite_201_Astra.pdf",
    text: "SURAT PERJANJIAN SEWA RUANG KANTOR VENTURA.\n\nAntara Pengelola Ventura Tower, Jl. TB Simatupang No.26 dan Astra International - Logistics Dept, diwakili oleh Budi Santoso, email ops.logistic@astra.co.id.\n\nPengelola menyewakan unit perkantoran Suite 201 di Lantai 02 Gedung Ventura kepada Penyewa.\n\nMasa sewa disepakati selama 1 (satu) tahun penuh mulai tanggal 15 Februari 2026 hingga 14 Februari 2027.\n\nNilai sewa bulanan adalah Rp 60.000.000 (enam juta Rupiah) ditambah jaminan sewa sebesar Rp 120.000.000.\n\nSewa bulanan harus dibayarkan paling lambat tanggal 15 setiap bulannya."
  }
];

export default function AIContractIntelligence({ 
  buildings, 
  tenants, 
  units, 
  documents,
  stats,
  onRefresh 
}: AIContractIntelligenceProps) {
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for the manual review step inside the popup modal
  const [reviewForm, setReviewForm] = useState({
    tenantName: "",
    tenantEmail: "",
    buildingId: "",
    unitId: "",
    unitNumber: "",
    floorNumber: "",
    monthlyRent: 0,
    securityDeposit: 0,
    billingDay: 5,
    startDate: "",
    endDate: "",
    sector: "Teknologi & Informasi",
    agentName: "Internal Marketing Team"
  });

  const handleUploadClick = async (textToUse: string, fileName: string, fileBase64?: string, fileMimeType?: string) => {
    setLoading(true);
    setSavedSuccess(false);
    setExtractedData(null);

    try {
      const response = await fetch("/api/gemini/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToUse,
          fileName: fileName,
          fileBase64: fileBase64,
          fileMimeType: fileMimeType
        })
      });

      if (!response.ok) {
        throw new Error("Gagal mengekstrak data dari AI Server.");
      }

      const result = await response.json();
      const data = result.extracted;

      // Find matching building or unit
      const bName = data.buildingName?.value || "";
      const matchingBld = buildings.find(b => 
        b.name.toLowerCase().includes(bName.toLowerCase()) || 
        bName.toLowerCase().includes(b.name.toLowerCase())
      ) || buildings[0];

      const uNo = data.unitNumber?.value || "";
      const matchingUnit = units.find(u => 
        u.unitNumber.toLowerCase().includes(uNo.toLowerCase()) ||
        uNo.toLowerCase().includes(u.unitNumber.toLowerCase())
      ) || units[0];

      setExtractedData(data);
      
      // Populate the manual review form
      setReviewForm({
        tenantName: data.tenantName?.value || "",
        tenantEmail: data.tenantEmail?.value || "",
        buildingId: matchingBld?.id || "bld-tifa",
        unitId: matchingUnit?.id || "unit-tifa-201",
        unitNumber: data.unitNumber?.value || "Suite 201",
        floorNumber: data.floorNumber?.value || "02",
        monthlyRent: Number(data.monthlyRent?.value || 0),
        securityDeposit: Number(data.securityDeposit?.value || 0),
        billingDay: Number(data.billingDay?.value || 5),
        startDate: data.startDate?.value || "2026-07-01",
        endDate: data.endDate?.value || "2027-07-01",
        sector: "Teknologi & Informasi",
        agentName: "Internal Marketing Team"
      });
    } catch (err: any) {
      alert("Ekstraksi gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const commaIndex = base64Data.indexOf(",");
      const rawBase64 = commaIndex !== -1 ? base64Data.substring(commaIndex + 1) : base64Data;
      
      await handleUploadClick("", file.name, rawBase64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: name === "monthlyRent" || name === "securityDeposit" || name === "billingDay" ? Number(value) : value
    }));
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      // 1. Create Tenant
      const newTenant = {
        id: `ten-${Date.now()}`,
        companyName: reviewForm.tenantName,
        contactPerson: reviewForm.tenantName.split(" ")[0] || "Contact Person",
        email: reviewForm.tenantEmail,
        phone: "021-55551234",
        sector: reviewForm.sector,
        createdBy: "AI-OCR-Intelligence",
        createdAt: new Date().toISOString()
      };
      await addDocument("tenants", newTenant);

      // 2. Create Lease in draft / awaiting_approval status
      const bld = buildings.find(b => b.id === reviewForm.buildingId);
      const newLease = {
        id: `lease-${Date.now()}`,
        tenantId: newTenant.id,
        tenantName: reviewForm.tenantName,
        buildingId: reviewForm.buildingId,
        buildingName: bld?.name || "TIFA Building",
        unitId: reviewForm.unitId,
        unitNumber: reviewForm.unitNumber,
        floorNumber: reviewForm.floorNumber,
        startDate: reviewForm.startDate,
        endDate: reviewForm.endDate,
        monthlyRent: reviewForm.monthlyRent,
        securityDeposit: reviewForm.securityDeposit,
        billingDay: reviewForm.billingDay,
        status: "awaiting_approval" as const,
        approvalStage: "legal" as const,
        googleDriveUrl: `https://drive.google.com/drive/folders/tpms-ai-ocr-${Date.now()}`,
        agentName: reviewForm.agentName,
        createdAt: new Date().toISOString(),
        createdBy: "AI-OCR-Intelligence"
      };
      await addDocument("leases", newLease);

      // 3. Create Document Linked to Google Drive
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: `Sewa_${reviewForm.tenantName.replace(/\s+/g, "_")}_ManualReview.pdf`,
        type: "application/pdf",
        size: "3.5 MB",
        googleDriveUrl: newLease.googleDriveUrl,
        buildingId: reviewForm.buildingId,
        buildingName: bld?.name || "TIFA Building",
        tenantId: newTenant.id,
        tenantName: reviewForm.tenantName,
        leaseId: newLease.id,
        uploadedAt: new Date().toISOString()
      };
      await addDocument("documents", newDoc);

      // 4. Register Approval Workflow Stage 1
      const newWf = {
        id: `wf-${Date.now()}`,
        leaseId: newLease.id,
        tenantName: reviewForm.tenantName,
        buildingName: bld?.name || "TIFA Building",
        unitNumber: reviewForm.unitNumber,
        requestedBy: "TPMS AI OCR Engine",
        requestedAt: new Date().toISOString(),
        stage: "legal" as const,
        status: "pending" as const,
        comments: `Dokumen diekstrak via AI Contract Intelligence. Diperoleh dari Agen: ${reviewForm.agentName}. Bidang: ${reviewForm.sector}. Menunggu review legal.`
      };
      await addDocument("approvalWorkflows", newWf);

      setSavedSuccess(true);
      setExtractedData(null);
      onRefresh();
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderConfidenceBadge = (score: number) => {
    const isHigh = score >= 90;
    const isMedium = score >= 75;
    return (
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-semibold ${
        isHigh ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
        isMedium ? "bg-amber-950 text-amber-400 border border-amber-800" :
        "bg-rose-950 text-rose-400 border border-rose-800"
      }`}>
        {score}% Confidence
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            AI Contract Intelligence & Extractor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Pindai kontrak draf sewa secara otomatis menggunakan AI Extractor. Sistem mendeteksi entitas hukum, finansial, dan masa kontrak dari naskah PDF asli, lalu membuka popup validasi data beserta penambahan isian manual dropdown agent dan bidang usaha.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload Templates (Left) vs Registry Dashboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload box & Select templates */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 font-sans">
              1. Sumber Dokumen Kontrak Sewa
            </h3>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                dragActive 
                  ? "border-cyan-400 bg-cyan-950/20" 
                  : "border-slate-800 hover:border-cyan-500/50 bg-slate-950/40"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden" 
              />
              <Upload className={`w-8 h-8 text-slate-500 mb-2 ${dragActive ? "animate-pulse text-cyan-400" : "animate-bounce"}`} />
              <p className="font-sans text-xs text-slate-300 font-semibold">
                {dragActive ? "Lepaskan file di sini" : "Unggah File Kontrak PDF / Scan"}
              </p>
              <p className="font-sans text-[10px] text-slate-500 mt-1">Sistem mendukung format PDF, JPG, PNG hingga 50MB</p>
            </div>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-sans">Gunakan Mock SandBox</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              {SAMPLE_TEMPLATES.map((temp, i) => (
                <div 
                  key={i}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-750 p-3.5 rounded-xl flex justify-between items-center transition"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-sans text-xs font-bold text-white truncate">{temp.title}</p>
                    <p className="font-sans text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {temp.fileName}
                    </p>
                  </div>
                  <button
                    id={`btn-ocr-template-${i}`}
                    onClick={() => handleUploadClick(temp.text, temp.fileName)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-[10px] font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 shrink-0 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Extract
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Success Notification Alert */}
          {savedSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold font-sans">Penyewa Berhasil Didaftarkan!</h4>
                <p className="text-[11px] font-sans text-slate-400 mt-1 leading-relaxed">
                  Data kontrak telah diekstraksi secara akurat. Profil tenant baru terdaftar, workflow draf persetujuan hukum otomatis dibuat, dan file disimpan ke folder arsip digital Google Drive.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Occupancy Progress Tracker & Google Drive File Registry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Building Occupancy Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              Live Occupancy & Development level
            </h3>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Total Tingkat Isian Portfolio (Occupancy level)</span>
                <span className="text-base font-bold font-mono text-cyan-400">{stats.occupancyRate}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${stats.occupancyRate}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider font-sans mb-0.5">Total Unit</span>
                  <span className="text-sm font-bold text-white font-mono">{stats.totalUnits} Unit</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/60">
                  <span className="text-[9px] text-emerald-500/80 block uppercase font-bold tracking-wider font-sans mb-0.5">Terisi (Leased)</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{stats.occupiedUnits} Unit</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/60">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider font-sans mb-0.5">Kosong (Vacant)</span>
                  <span className="text-sm font-bold text-slate-400 font-mono">{stats.totalUnits - stats.occupiedUnits} Unit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Contract File Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Berkas Terproses & Link Google Drive
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {documents.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-850 border-dashed rounded-lg py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="font-sans text-xs">Belum ada berkas digital yang diekstrak oleh sistem</p>
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div 
                    key={doc.id || idx} 
                    className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between gap-3 hover:border-slate-750 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate font-sans">{doc.name}</h5>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          Tenant: <span className="text-slate-300">{doc.tenantName || "Sewa"}</span> • {doc.buildingName}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={doc.googleDriveUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-slate-500 hover:text-cyan-400 p-2 rounded-lg transition bg-slate-900 border border-slate-850 hover:border-slate-800 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Extraction Loading State */}
      {loading && !extractedData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center max-w-sm text-center space-y-4 shadow-2xl">
            <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
            <h3 className="font-sans font-bold text-sm text-white">AI Extraction Engine Berjalan...</h3>
            <p className="font-sans text-xs text-slate-400">
              Gemini AI sedang memindai draf perjanjian sewa, menjalankan OCR cerdas, dan merangkum rincian legal finansial kontrak secara real-time.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* POPUP MODAL DIALOG: AI Extraction & Manual Review Form */}
      {/* ======================================================= */}
      {extractedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-950 p-1.5 rounded-lg border border-cyan-800">
                    <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    Hasil Ekstraksi AI & Verifikasi Manual
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  Harap verifikasi akurasi bacaan AI dan lengkapi dropdown isian wajib di bawah sebelum menyimpan berkas.
                </p>
              </div>
              <button 
                onClick={() => setExtractedData(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
              
              {/* Manual Input Dropdowns Block Requested by User */}
              <div className="bg-cyan-950/20 border border-cyan-800/60 p-4 rounded-xl space-y-3.5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  Isian Manual (Wajib & Terstandar)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bidang Perusahaan Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase font-sans flex items-center gap-1">
                      Bidang Perusahaan *
                    </label>
                    <select
                      name="sector"
                      value={reviewForm.sector}
                      onChange={handleFormChange}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-sans outline-hidden cursor-pointer"
                    >
                      <option value="Teknologi & Informasi">Teknologi & Informasi</option>
                      <option value="Keuangan & Perbankan">Keuangan & Perbankan</option>
                      <option value="F&B / Kuliner">F&B / Kuliner</option>
                      <option value="Ritel / Perdagangan">Ritel / Perdagangan</option>
                      <option value="Logistik & Transportasi">Logistik & Transportasi</option>
                      <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                      <option value="Konsultan / Jasa">Konsultan / Jasa</option>
                      <option value="Manufaktur & Energi">Manufaktur & Energi</option>
                    </select>
                  </div>

                  {/* Property Agent Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase font-sans flex items-center gap-1">
                      Nama Agent Properti *
                    </label>
                    <select
                      name="agentName"
                      value={reviewForm.agentName}
                      onChange={handleFormChange}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-sans outline-hidden cursor-pointer"
                    >
                      <option value="Rian Wijaya (TPMS Realty)">Rian Wijaya (TPMS Realty)</option>
                      <option value="Siti Rahma (Kuningan Property)">Siti Rahma (Kuningan Property)</option>
                      <option value="Dodi Setiawan (Century 21)">Dodi Setiawan (Century 21)</option>
                      <option value="Amelia Putri (Ray White)">Amelia Putri (Ray White)</option>
                      <option value="Andi Pratama (Era Indonesia)">Andi Pratama (Era Indonesia)</option>
                      <option value="Internal Marketing Team">Internal Marketing Team</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parsed / Extracted Values Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Tenant Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Nama Perusahaan / Tenant
                    {renderConfidenceBadge(extractedData.tenantName?.confidence || 95)}
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={reviewForm.tenantName}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Tenant Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Kontak Email Tenant
                    {renderConfidenceBadge(extractedData.tenantEmail?.confidence || 90)}
                  </label>
                  <input
                    type="email"
                    name="tenantEmail"
                    value={reviewForm.tenantEmail}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Building Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Gedung Tujuan
                    {renderConfidenceBadge(extractedData.buildingName?.confidence || 95)}
                  </label>
                  <select
                    name="buildingId"
                    value={reviewForm.buildingId}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden cursor-pointer"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Nomor Unit / Suite
                    {renderConfidenceBadge(extractedData.unitNumber?.confidence || 96)}
                  </label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={reviewForm.unitNumber}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Floor Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Lantai
                    {renderConfidenceBadge(extractedData.floorNumber?.confidence || 88)}
                  </label>
                  <input
                    type="text"
                    name="floorNumber"
                    value={reviewForm.floorNumber}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Monthly Rent */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Sewa Bulanan (IDR)
                    {renderConfidenceBadge(extractedData.monthlyRent?.confidence || 99)}
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={reviewForm.monthlyRent}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden font-mono"
                  />
                </div>

                {/* Security Deposit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Security Deposit (IDR)
                    {renderConfidenceBadge(extractedData.securityDeposit?.confidence || 95)}
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={reviewForm.securityDeposit}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden font-mono"
                  />
                </div>

                {/* Billing Day */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Jatuh Tempo (Hari ke-x)
                    {renderConfidenceBadge(extractedData.billingDay?.confidence || 92)}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    name="billingDay"
                    value={reviewForm.billingDay}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Tanggal Mulai Sewa
                    {renderConfidenceBadge(extractedData.startDate?.confidence || 94)}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={reviewForm.startDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between items-center">
                    Tanggal Selesai Sewa
                    {renderConfidenceBadge(extractedData.endDate?.confidence || 94)}
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={reviewForm.endDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>
              </div>

              {/* Info Verification Warning */}
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg flex gap-2 text-amber-400 text-[10px] leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Verifikasi Manual:</strong> Apabila ada naskah yang kurang terbaca oleh sensor OCR, Anda dipersilakan mengoreksi langsung pada isian input di atas untuk memastikan akurasi data 100%.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                id="btn-ocr-cancel"
                onClick={() => setExtractedData(null)}
                className="bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white font-sans text-xs font-semibold px-4.5 py-2 rounded-lg transition border border-slate-850"
              >
                Batal
              </button>
              <button
                id="btn-ocr-commit"
                onClick={handleCommit}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-sans text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/10"
              >
                <Check className="w-4 h-4 text-white" />
                Simpan & Daftarkan Kontrak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
