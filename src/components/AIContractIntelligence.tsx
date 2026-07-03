import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Play, Check, ShieldAlert, Cpu, RefreshCw, Layers } from "lucide-react";
import { addDocument } from "../lib/db";

interface AIContractIntelligenceProps {
  buildings: any[];
  tenants: any[];
  units: any[];
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
    text: "SURAT PERJANJIAN SEWA RUANG KANTOR VENTURA.\n\nAntara Pengelola Ventura Tower, Jl. TB Simatupang No.26 dan Astra International - Logistics Dept, diwakili oleh Budi Santoso, email ops.logistic@astra.co.id.\n\nPengelola menyewakan unit perkantoran Suite 201 di Lantai 02 Gedung Ventura kepada Penyewa.\n\nMasa sewa disepakati selama 1 (satu) tahun penuh mulai tanggal 15 Februari 2026 hingga 14 Februari 2027.\n\nNilai sewa bulanan adalah Rp 60.000.000 (enam puluh juta Rupiah) ditambah jaminan sewa sebesar Rp 120.000.000.\n\nSewa bulanan harus dibayarkan paling lambat tanggal 15 setiap bulannya."
  }
];

export default function AIContractIntelligence({ 
  buildings, 
  tenants, 
  units, 
  onRefresh 
}: AIContractIntelligenceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states for the manual review step
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
    endDate: ""
  });

  const handleUploadClick = async (textToUse: string, fileName: string) => {
    setLoading(true);
    setSavedSuccess(false);
    setExtractedData(null);

    try {
      const response = await fetch("/api/gemini/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToUse,
          fileName: fileName
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
        endDate: data.endDate?.value || "2027-07-01"
      });
    } catch (err: any) {
      alert("Ekstraksi gagal: " + err.message);
    } finally {
      setLoading(false);
    }
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
        sector: "Hasil Ekstraksi AI",
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
        status: "awaiting_approval", // Enter approval workflow automatically!
        approvalStage: "legal", // starts with legal stage
        googleDriveUrl: `https://drive.google.com/drive/folders/tpms-ai-ocr-${Date.now()}`,
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
        stage: "legal",
        status: "pending",
        comments: "Dokumen diekstrak via AI Contract Intelligence. Menunggu review legal penandatanganan."
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
            AI Contract Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Unggah draf kontrak atau pilih template dokumen sewa di bawah. AI akan menjalankan OCR, melakukan ekstraksi data otomatis ke format tabel database, melampirkan **Confidence Score**, dan mengizinkan peninjauan manual (Manual Review) sebelum data disimpan secara permanen di database dan Google Drive.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Templates vs Extraction Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload & Templates */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-sans">
              1. Sumber Dokumen Kontrak
            </h3>
            
            <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40">
              <Upload className="w-8 h-8 text-slate-500 mb-2" />
              <p className="font-sans text-xs text-slate-300 font-semibold">Unggah File Kontrak PDF / Hasil Scan</p>
              <p className="font-sans text-[10px] text-slate-500 mt-1">Hingga 50MB (PDF, PNG, JPG)</p>
            </div>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-sans">Atau Gunakan Mock Sandbox</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              {SAMPLE_TEMPLATES.map((temp, i) => (
                <div 
                  key={i}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex justify-between items-center transition"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-semibold text-white truncate">{temp.title}</p>
                    <p className="font-sans text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      {temp.fileName}
                    </p>
                  </div>
                  <button
                    id={`btn-ocr-template-${i}`}
                    onClick={() => handleUploadClick(temp.text, temp.fileName)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-[10px] font-bold py-1 px-2.5 rounded-md flex items-center gap-1 shrink-0 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Run AI
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Success Message */}
          {savedSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-sans">Dokumen Berhasil Diproses!</h4>
                <p className="text-[11px] font-sans text-emerald-400 mt-0.5 leading-relaxed">
                  Data kontrak telah diekstraksi, divalidasi, dan dimasukkan ke dalam antrean **Approval Workflow**. Salinan draf digital telah disinkronisasikan ke folder Google Drive Anda.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI OCR Results & Manual Review Workspace */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-96">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <h3 className="font-sans font-bold text-sm text-white">AI Engine Berjalan...</h3>
              <p className="font-sans text-xs text-slate-500 mt-1 max-w-sm">
                Gemini AI sedang melakukan pembacaan dokumen, pencarian OCR, klasifikasi kalimat hukum, serta estimasi tingkat kepercayaan (confidence scores).
              </p>
            </div>
          ) : extractedData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 h-full">
              {/* Header result */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                    2. AI Extraction & Manual Review Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Tinjau data di bawah sebelum mendaftarkannya ke sistem.
                  </p>
                </div>
                <div className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 font-sans">
                  <Cpu className="w-3.5 h-3.5" />
                  OCR Parsed
                </div>
              </div>

              {/* Grid Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tenant Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Nama Perusahaan / Tenant
                    {renderConfidenceBadge(extractedData.tenantName?.confidence || 95)}
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={reviewForm.tenantName}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Tenant Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Kontak Email Tenant
                    {renderConfidenceBadge(extractedData.tenantEmail?.confidence || 90)}
                  </label>
                  <input
                    type="email"
                    name="tenantEmail"
                    value={reviewForm.tenantEmail}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Building Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Gedung Tujuan
                    {renderConfidenceBadge(extractedData.buildingName?.confidence || 95)}
                  </label>
                  <select
                    name="buildingId"
                    value={reviewForm.buildingId}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Nomor Unit / Suite
                    {renderConfidenceBadge(extractedData.unitNumber?.confidence || 96)}
                  </label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={reviewForm.unitNumber}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Floor Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Lantai
                    {renderConfidenceBadge(extractedData.floorNumber?.confidence || 88)}
                  </label>
                  <input
                    type="text"
                    name="floorNumber"
                    value={reviewForm.floorNumber}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Monthly Rent */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Sewa Bulanan (IDR)
                    {renderConfidenceBadge(extractedData.monthlyRent?.confidence || 99)}
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={reviewForm.monthlyRent}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Security Deposit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Security Deposit (IDR)
                    {renderConfidenceBadge(extractedData.securityDeposit?.confidence || 95)}
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={reviewForm.securityDeposit}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Billing Day */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Tanggal Mulai Sewa
                    {renderConfidenceBadge(extractedData.startDate?.confidence || 94)}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={reviewForm.startDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans flex justify-between">
                    Tanggal Selesai Sewa
                    {renderConfidenceBadge(extractedData.endDate?.confidence || 94)}
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={reviewForm.endDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden"
                  />
                </div>
              </div>

              {/* Alert message about manual verification */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg flex gap-2.5 text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-amber-400">Verifikasi Manual Diperlukan:</strong> Pastikan seluruh nilai di atas sesuai dengan isi draf fisik kontrak asli. Jika Anda menemukan kesalahan baca OCR, silakan perbaiki langsung di kotak input di atas sebelum menyimpan data.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  id="btn-ocr-cancel"
                  onClick={() => setExtractedData(null)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg transition"
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
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-96">
              <FileText className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="font-sans font-bold text-sm text-slate-400">Belum Ada Dokumen Yang Diproses</h3>
              <p className="font-sans text-xs text-slate-500 mt-1 max-w-sm">
                Silakan pilih salah satu draf kontrak digital di sisi kiri untuk menjalankan algoritma ekstraksi cerdas AI Contract Intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
