import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 PDF uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI features will run in intelligent simulation mode.");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Helper to determine if we are in mock mode
function isMockMode(): boolean {
  return !process.env.GEMINI_API_KEY;
}

// API Routes

// 1. Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. AI Contract Intelligence: OCR & Extraction with Confidence Scores
app.post("/api/gemini/ocr-extract", async (req, res) => {
  const { text, fileName, fileBase64, fileMimeType } = req.body;

  if (!text && !fileName && !fileBase64) {
    return res.status(400).json({ error: "Mohon sediakan teks, nama file, atau file base64 kontrak." });
  }

  if (isMockMode()) {
    // Generate an intelligent mock response based on filename/content
    const textLower = (text || "").toLowerCase();
    const fileLower = (fileName || "").toLowerCase();

    let tenantName = "PT Telekomunikasi Selular (Telkomsel)";
    let tenantEmail = "procurement@telkomsel.co.id";
    let buildingName = "TIFA Building";
    let unitNumber = "Suite 302";
    let floorNumber = "03";
    let monthlyRent = 88000000;
    let securityDeposit = 176000000;
    let billingDay = 5;
    let startDate = "2026-08-01";
    let endDate = "2028-07-31";

    if (fileLower.includes("kopi") || textLower.includes("kopi") || fileLower.includes("kenangan")) {
      tenantName = "PT Kopi Jiwa Sejahtera";
      tenantEmail = "retail.property@kopikenangan.id";
      buildingName = "Alamanda";
      unitNumber = "Suite 101";
      floorNumber = "01";
      monthlyRent = 52500000;
      securityDeposit = 105000000;
      billingDay = 10;
      startDate = "2026-03-01";
      endDate = "2027-02-28";
    } else if (fileLower.includes("medidata") || textLower.includes("medidata")) {
      tenantName = "PT Medidata Indonesia";
      tenantEmail = "finance@medidata.co.id";
      buildingName = "TIFA Building";
      unitNumber = "Suite 201";
      floorNumber = "02";
      monthlyRent = 63000000;
      securityDeposit = 126000000;
      billingDay = 5;
      startDate = "2026-01-01";
      endDate = "2027-12-31";
    } else if (fileLower.includes("astra") || textLower.includes("astra")) {
      tenantName = "PT Astra International Tbk";
      tenantEmail = "facilities.procurement@astra.co.id";
      buildingName = "Ventura";
      unitNumber = "Suite 201";
      floorNumber = "02";
      monthlyRent = 60000000;
      securityDeposit = 120000000;
      billingDay = 15;
      startDate = "2026-02-15";
      endDate = "2027-02-14";
    }

    // Return structured data with confidence scores
    return res.json({
      extracted: {
        tenantName: { value: tenantName, confidence: 97 },
        tenantEmail: { value: tenantEmail, confidence: 91 },
        buildingName: { value: buildingName, confidence: 95 },
        unitNumber: { value: unitNumber, confidence: 96 },
        floorNumber: { value: floorNumber, confidence: 89 },
        monthlyRent: { value: monthlyRent, confidence: 99 },
        securityDeposit: { value: securityDeposit, confidence: 98 },
        billingDay: { value: billingDay, confidence: 93 },
        startDate: { value: startDate, confidence: 95 },
        endDate: { value: endDate, confidence: 95 }
      },
      isMock: true
    });
  }

  try {
    const ai = getAi();
    const prompt = `You are a real-estate legal AI trained in Indonesian commercial lease agreements.
Parse the lease agreement document. For each of the following fields, extract its value and assign a realistic "confidence" score (percentage 0 to 100) based on how clearly and explicitly it was stated in the text or image.

Fields to extract:
1. tenantName: Full business name or legal entity (e.g., "PT Telekomunikasi Indonesia")
2. tenantEmail: Contact email or generate a professional one based on entity (e.g. "procurement@telkom.co.id")
3. buildingName: Match exactly with one of these buildings: "Ventura", "TIFA Building", "Alamanda", "GBS Surabaya".
4. unitNumber: The suite or room number (e.g. "Suite 201")
5. floorNumber: The floor number as string (e.g., "01", "02", "12")
6. monthlyRent: Monthly rent in IDR (extract number only)
7. securityDeposit: Security deposit in IDR (extract number only)
8. billingDay: The day of month rent is due (extract 1 to 31, default to 5)
9. startDate: Lease start date in YYYY-MM-DD
10. endDate: Lease end date in YYYY-MM-DD

Return ONLY a valid JSON object matching the schema below, without markdown formatting or code blocks:
{
  "tenantName": { "value": "...", "confidence": 98 },
  "tenantEmail": { "value": "...", "confidence": 90 },
  "buildingName": { "value": "...", "confidence": 95 },
  "unitNumber": { "value": "...", "confidence": 96 },
  "floorNumber": { "value": "...", "confidence": 88 },
  "monthlyRent": { "value": 15000000, "confidence": 99 },
  "securityDeposit": { "value": 30000000, "confidence": 95 },
  "billingDay": { "value": 5, "confidence": 90 },
  "startDate": { "value": "2026-01-01", "confidence": 94 },
  "endDate": { "value": "2027-12-31", "confidence": 94 }
}`;

    const parts: any[] = [];
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64
        }
      });
    }

    if (text) {
      parts.push({
        text: `Text contents of the contract:\n${text}\n\n${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: parts },
    });

    const cleanText = (response.text || "").replace(/```json/gi, "").replace(/```/gi, "").trim();
    const parsed = JSON.parse(cleanText);
    res.json({ extracted: parsed, isMock: false });
  } catch (error: any) {
    console.error("OCR Extraction Error:", error);
    res.status(500).json({ error: "Gagal mengekstraksi data kontrak otomatis: " + error.message });
  }
});

// 3. AI Contract Comparison
app.post("/api/gemini/compare-contracts", async (req, res) => {
  const { contractA, contractB } = req.body;

  if (!contractA || !contractB) {
    return res.status(400).json({ error: "Mohon sediakan kedua versi kontrak yang akan dibandingkan." });
  }

  if (isMockMode()) {
    const mockReport = `### 🔍 AI Contract Comparison Report (TPMS Enterprise Intel)

Berikut adalah hasil perbandingan otomatis antara **Kontrak Versi 1 (Asli)** dan **Kontrak Versi 2 (Revisi)**:

#### **1. Perubahan Finansial (Sewa & Deposit)**
*   **Harga Sewa Per Bulan:**
    *   *Versi 1:* Rp 60.000.000 / bulan
    *   *Versi 2 (Revisi):* **Rp 65.000.000 / bulan** (Mengalami kenaikan sebesar **Rp 5.000.000 / 8.33%**)
*   **Security Deposit:**
    *   *Versi 1:* Rp 120.000.000 (Setara 2 bulan sewa)
    *   *Versi 2:* **Rp 130.000.000** (Disesuaikan mengikuti harga sewa baru, aman)

#### **2. Perubahan Klausul Hukum & Operasional**
*   **Grace Period Pembayaran (Pasal 4.2):**
    *   *Versi 1:* Pembayaran dilakukan paling lambat tanggal 5 setiap bulan.
    *   *Versi 2:* Ditambahkan klausul **toleransi keterlambatan hingga tanggal 10 setiap bulan** tanpa dikenakan denda (Menguntungkan Tenant, perlu review manajemen).
*   **Tanggung Jawab Pemeliharaan AC (Pasal 7.1):**
    *   *Versi 1:* Pemeliharaan rutin AC sepenuhnya ditanggung oleh Pengelola Gedung.
    *   *Versi 2:* Ditambahkan batas maksimal beban perbaikan sebesar **Rp 2.500.000 per unit** yang harus ditanggung Tenant sebelum sisa biaya ditanggung Pengelola (Perubahan Material).

#### **3. Kesimpulan & Rekomendasi Hukum (Legal Insight)**
*   **Tingkat Risiko Perubahan:** 🟡 **Medium Risk**
*   **Rekomendasi:** Kenaikan harga sewa menguntungkan perusahaan pengelola, namun klausul pergeseran biaya pemeliharaan AC senilai Rp 2.500.000 ke Tenant sangat baik untuk mengurangi biaya operasional gedung. Disarankan menyetujui draf revisi ini.`;
    return res.json({ comparison: mockReport, isMock: true });
  }

  try {
    const ai = getAi();
    const prompt = `You are an expert commercial real-estate attorney. Compare the two versions of the lease contract text provided below.
Identify and highlight any differences in:
1. Financial terms (rent price, security deposit, billing day, penalties)
2. Term dates (start, end, renewal notice window)
3. Operational clauses (maintenance caps, sub-leasing, tenant responsibilities)
4. Legal clauses (liability, termination notice, force majeure)

Structure your report in elegant Markdown in Bahasa Indonesia. Rate the changes as Low, Medium, or High risk for the property owner/management company, and give a clear legal recommendation on whether to sign or negotiate.

Contract A (Original):
${contractA}

Contract B (Revised):
${contractB}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ comparison: response.text || "Gagal membandingkan kontrak.", isMock: false });
  } catch (error: any) {
    console.error("Contract Comparison Error:", error);
    res.status(500).json({ error: "Gagal membandingkan kontrak: " + error.message });
  }
});

// 4. AI Assistant Chat: Fully Contextual Understanding of Building Operations
app.post("/api/gemini/assistant-chat", async (req, res) => {
  const { message, history, dataContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mohon masukkan pesan Anda." });
  }

  const contextStr = JSON.stringify({
    buildings: dataContext?.buildings?.map((b: any) => ({ name: b.name, address: b.address, totalFloors: b.totalFloors, totalUnits: b.totalUnits })),
    units: dataContext?.units?.map((u: any) => ({ building: u.buildingName, floor: u.floorNumber, number: u.unitNumber, area: u.areaSqm, rentPerSqm: u.rentPerSqm, status: u.status })),
    leases: dataContext?.leases?.map((l: any) => ({ tenant: l.tenantName, building: l.buildingName, unit: l.unitNumber, rent: l.monthlyRent, start: l.startDate, end: l.endDate, status: l.status })),
    payments: dataContext?.payments?.map((p: any) => ({ tenant: p.tenantName, building: p.buildingName, amount: p.amount, status: p.status, dueDate: p.dueDate }))
  });

  if (isMockMode()) {
    // Generate intelligent responses without key
    const msg = message.toLowerCase();
    let reply = "";

    if (msg.includes("unit kosong") || msg.includes("kosong") || msg.includes("empty")) {
      reply = `### 🏢 Daftar Unit Kosong (Available Spaces)

Saat ini terdapat beberapa unit kosong premium yang siap ditawarkan kepada calon tenant baru:

1.  **TIFA Building (Suite 102)**
    *   **Lantai:** 01
    *   **Luas:** 120 m²
    *   **Harga Sewa:** Rp 200.000 / m² / bulan (Estimasi: Rp 24.000.000 / bulan)
    *   **Kondisi:** Sangat cocok untuk cabang retail premium atau layanan perbankan.
2.  **TIFA Building (Suite 202)**
    *   **Lantai:** 02
    *   **Luas:** 280 m²
    *   **Harga Sewa:** Rp 180.000 / m² / bulan (Estimasi: Rp 50.400.000 / bulan)
    *   **Kondisi:** Sudah berkarpet, dilengkapi partisi ruangan rapat eksekutif.
3.  **Ventura (Suite 202)**
    *   **Lantai:** 02
    *   **Luas:** 220 m²
    *   **Harga Sewa:** Rp 200.000 / m² / bulan (Estimasi: Rp 44.000.000 / bulan)
    *   **Kondisi:** Ruangan bare/shell, siap didekorasi sesuai kebutuhan tenant.
4.  **Alamanda (Suite 201)**
    *   **Lantai:** 02
    *   **Luas:** 400 m²
    *   **Harga Sewa:** Rp 210.000 / m² / bulan (Estimasi: Rp 84.000.000 / bulan)
    *   **Kondisi:** Ruang kantor luas dengan pemandangan jalan raya utama kota (city view).

**Rekomendasi AI:** Hubungi tim marketing Anda untuk menawarkan **Alamanda Suite 201** kepada prospek korporasi besar karena luas m²-nya yang prestisius dan lokasinya yang strategis.`;
    } else if (msg.includes("habis") || msg.includes("berakhir") || msg.includes("expire") || msg.includes("contract")) {
      reply = `### ⚠️ Analisis Kontrak Segera Berakhir

Berdasarkan data operasional TPMS Enterprise, berikut adalah kontrak aktif yang akan segera berakhir dalam 12 bulan ke depan:

1.  **Astra International - Logistics Dept**
    *   **Gedung:** Ventura, Suite 201
    *   **Tanggal Berakhir:** 14 Februari 2027 (~225 hari lagi)
    *   **Sewa Bulanan:** Rp 60.000.000 / bulan
    *   **Status Review:** Perlu segera mengirimkan surat pemberitahuan opsi perpanjangan dalam 30 hari ke depan.
2.  **PT Kopi Jiwa Sejahtera (Kopi Kenangan)**
    *   **Gedung:** Alamanda, Suite 101
    *   **Tanggal Berakhir:** 28 Februari 2027 (~240 hari lagi)
    *   **Sewa Bulanan:** Rp 52.500.000 / bulan
    *   **Status Review:** Hubungan tenant sangat baik, rekomendasi perpanjangan dengan opsi penyesuaian harga sewa 5%.

**Rekomendasi Tindakan:** Saya sarankan Anda membuat draf pemberitahuan perpanjangan sewa otomatis untuk **Astra International** menggunakan modul *Lease Management* untuk mengunci komitmen mereka lebih awal.`;
    } else if (msg.includes("pendapatan") || msg.includes("revenue") || msg.includes("laporan") || msg.includes("okupansi")) {
      reply = `### 📊 Laporan Ringkas Okupansi & Keuangan Portofolio

Berikut adalah rangkuman analisis operasional real-time untuk 4 gedung utama:

#### **1. Tingkat Okupansi Gedung**
*   **TIFA Building:** 50% Occupied (2 leased, 2 empty, 1 maintenance)
*   **Ventura:** 66% Occupied (2 leased, 1 empty)
*   **Alamanda:** 50% Occupied (1 leased, 1 empty)
*   **GBS Surabaya:** 100% Occupied (1 leased)
*   **Rata-rata Okupansi Portofolio:** **61.5%**

#### **2. Estimasi Pendapatan Sewa Bulanan**
*   **TIFA Building:** Rp 96.000.000
*   **Ventura:** Rp 60.000.000
*   **Alamanda:** Rp 52.500.000
*   **GBS Surabaya:** Rp 24.000.000 (Estimasi)
*   **Total Pendapatan Berjalan:** **Rp 232.500.000 / bulan**

#### **3. Piutang & Keterlambatan Pembayaran (Overdue Alerts)**
*   Terdapat **1 tagihan overdue** dari **PT Medidata Indonesia** sebesar **Rp 63.000.000** (Jatuh tempo 5 Juli 2026).
*   *Tindakan:* Tim Finance direkomendasikan mengirimkan Surat Peringatan Tagihan 1 (SP1) otomatis besok pagi.`;
    } else {
      reply = `### 👋 Halo! Saya TPMS AI Enterprise Assistant.

Saya dapat membantu Anda mengelola dan menanyakan seluruh operasional 4 gedung Anda secara terintegrasi (**Ventura**, **TIFA Building**, **Alamanda**, dan **GBS Surabaya**).

**Beberapa hal yang bisa Anda tanyakan kepada saya:**
*   *"Tunjukkan daftar unit kosong di TIFA Building"*
*   *"Apakah ada kontrak sewa tenant yang segera berakhir?"*
*   *"Berikan analisis pendapatan sewa dan okupansi bulan ini"*
*   *"Tolong carikan detail kontak tenant PT Medidata Indonesia"*

Silakan ketikkan pertanyaan operasional Anda di bawah!`;
    }

    return res.json({ reply, isMock: true });
  }

  try {
    const ai = getAi();
    const prompt = `You are TPMS AI Enterprise Assistant, an advanced, professional AI Property Specialist managing a portfolio of four premium commercial buildings in Indonesia: Ventura, TIFA Building, Alamanda, and GBS Surabaya.
You have real-time access to the building management database context below.

DATABASE CONTEXT:
${contextStr}

INSTRUCTIONS:
1. Answer the user's natural language question accurately based ONLY on the provided context.
2. Structure your reply beautifully using Markdown with clear headings, bullet points, and tables.
3. Keep the tone executive, helpful, precise, and authoritative.
4. Reply in Bahasa Indonesia (unless the query is strictly in English).
5. If the user asks for something not in the database, guide them politely on how to input it or explain what data is available.

User Query: "${message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ reply: response.text || "Gagal memproses pesan AI Assistant.", isMock: false });
  } catch (error: any) {
    console.error("AI Assistant Chat Error:", error);
    res.status(500).json({ error: "Gagal memproses obrolan AI Assistant: " + error.message });
  }
});

// Vite middleware / Static site serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
