import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI features will run in mock mode.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || "MOCK_KEY" });
  }
  return aiClient;
}

// API Routes

// 1. Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Draft Compliance Notice
app.post("/api/gemini/compliance-notice", async (req, res) => {
  const { tenantName, unitNumber, category, severity, details } = req.body;

  if (!tenantName || !category || !details) {
    return res.status(400).json({ error: "Missing required compliance details." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return a beautiful mock compliance notice if API Key is not set
    const mockNotice = `**TENANCY COMPLIANCE WARNING**

Date: ${new Date().toLocaleDateString()}
To: ${tenantName} (Unit ${unitNumber || "N/A"})
From: Master Tenancy Building Management
Subject: Compliance Notice regarding ${category.toUpperCase()}

Dear ${tenantName},

We are writing to formally notify you regarding a compliance issue recorded for your unit, ${unitNumber || "your registered unit"}, on ${new Date().toLocaleDateString()}.

**Details of the Occurrence:**
${details}

This issue falls under the category of **${category}** and is classified as a **${severity || "medium"}** severity violation. Please note that maintaining quiet enjoyment, common-space cleanliness, and property integrity is a strict condition of your Lease Agreement.

**Required Actions:**
1. Please remedy this situation immediately to prevent further escalation.
2. Ensure full compliance with Section 12 of your Master Tenancy Agreement.
3. If this violation is repeated, building management reserves the right to issue a formal warning or initiate eviction proceedings in accordance with local regulations.

Should you have any questions or wish to appeal this notice, please submit a written response via your tenant portal within 48 hours.

Sincerely,
Master Tenancy Building Management Team`;

    return res.json({ notice: mockNotice, isMock: true });
  }

  try {
    const ai = getAi();
    const prompt = `You are a professional, expert property and building manager.
Draft an official, elegant, yet firm Tenancy Compliance Notice based on the following details:
Tenant Name: ${tenantName}
Unit Number: ${unitNumber || "N/A"}
Category of Violation: ${category} (e.g. noise, maintenance, pets, unauthorized guests, late payment)
Severity: ${severity || "medium"}
Violation Details: ${details}

The notice must include:
1. Standard professional layout (To, From, Date, Subject).
2. A formal explanation of the issue and why it violates standard master lease agreements.
3. Concrete steps the tenant must take to resolve the issue.
4. Consequences of non-compliance (e.g., formal warnings, fines, or lease termination in accordance with standard property regulations).
5. A polite closing inviting them to contact management if there is a mistake.

Format the output strictly as professional Markdown text without HTML tags. Keep it realistic, authoritative, and helpful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ notice: response.text || "Failed to generate notice content.", isMock: false });
  } catch (error: any) {
    console.error("Gemini Compliance Notice Error:", error);
    res.status(500).json({ error: "Failed to generate notice due to an internal error: " + error.message });
  }
});

// 2.5. Extract Lease Details from Text or Filename
app.post("/api/gemini/extract-lease", async (req, res) => {
  const { text, fileName, fileBase64, fileMimeType } = req.body;

  if (!text && !fileName && !fileBase64) {
    return res.status(400).json({ error: "No lease text, file name, or file data provided." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Generate intelligent mock responses based on context to avoid hardcoding static stuff when keys are missing
    const textLower = (text || "").toLowerCase();
    const fileLower = (fileName || "").toLowerCase();
    
    let tenantName = "Rizky Pratama";
    let tenantEmail = "rizky.pratama@mandalagroup.id";
    let monthlyRent = "14500000";
    let securityDeposit = "29000000";
    let unitNumber = "B-201";
    let startDate = "2026-07-01";
    let endDate = "2027-07-01";
    let billingDay = 5;

    if (fileLower.includes("medidata") || textLower.includes("medidata")) {
      tenantName = "PT Medidata Indonesia";
      tenantEmail = "finance@medidata.co.id";
      monthlyRent = "22500000";
      securityDeposit = "45000000";
      unitNumber = "Office-304";
      startDate = "2026-07-01";
      endDate = "2027-07-01";
      billingDay = 25;
    } else if (textLower.includes("joko") || fileLower.includes("joko")) {
      tenantName = "Joko Widodo";
      tenantEmail = "joko.widodo@outlook.com";
      monthlyRent = "8500000";
      securityDeposit = "8500000";
      unitNumber = "A-102";
      startDate = "2026-08-01";
      endDate = "2027-08-01";
      billingDay = 1;
    } else if (textLower.includes("budi") || fileLower.includes("budi")) {
      tenantName = "Budi Santoso";
      tenantEmail = "budi.santoso@yahoo.com";
      monthlyRent = "12000000";
      securityDeposit = "24000000";
      unitNumber = "C-405";
      startDate = "2026-09-01";
      endDate = "2027-09-01";
      billingDay = 10;
    } else if (textLower.includes("ani") || fileLower.includes("ani") || textLower.includes("anisa") || fileLower.includes("anisa")) {
      tenantName = "Anisa Rahmawati";
      tenantEmail = "anisa.rahma@gmail.com";
      monthlyRent = "9500000";
      securityDeposit = "19000000";
      unitNumber = "B-303";
      startDate = "2026-07-15";
      endDate = "2027-07-15";
      billingDay = 15;
    } else {
      // Dynamic filename extractor
      const fileUnitMatch = fileLower.match(/(?:#|unit[-_]?|u[-_]?|suite[-_]?)([0-9a-z\-]+)/i);
      if (fileUnitMatch) {
        unitNumber = fileUnitMatch[1].toUpperCase();
      }
      
      const fileCleanName = (fileName || "")
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/^[\d\s-_]+/g, "") // remove leading numbers
        .split(/[#_]/)[0] // take everything before # or _
        .trim();
        
      if (fileCleanName && fileCleanName.length > 3 && !fileCleanName.toLowerCase().includes("lease") && !fileCleanName.toLowerCase().includes("terms")) {
        tenantName = fileCleanName;
        tenantEmail = `${tenantName.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`;
      }

      // Dynamic fallback extraction based on whatever terms might be parsed via regexes from input text
      const rentMatch = textLower.match(/(?:rent|sewa|harga|idr|rp)\s*[:=]?\s*([\d\.,]+)/i);
      if (rentMatch) {
        monthlyRent = rentMatch[1].replace(/[\.,]/g, "");
        securityDeposit = String(Number(monthlyRent) * 2);
      }
      const unitMatch = textLower.match(/(?:unit|no|nomor)\s*[:=]?\s*([a-z0-9\-]+)/i);
      if (unitMatch) {
        unitNumber = unitMatch[1].toUpperCase();
      }
      const nameMatch = textLower.match(/(?:name|nama|tenant|penyewa)\s*[:=]?\s*([a-z\s]{3,25})/i);
      if (nameMatch) {
        tenantName = nameMatch[1].trim().split("\n")[0];
        tenantEmail = `${tenantName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
      }
    }

    return res.json({
      tenantName,
      tenantEmail,
      unitNumber,
      monthlyRent,
      securityDeposit,
      billingDay,
      startDate,
      endDate,
      isMock: true
    });
  }

  try {
    const ai = getAi();
    const prompt = `You are an AI assistant designed to parse rental/lease agreement documents, images, or text descriptions.
Extract the following information from the provided lease content (text, file, or image):
1. Full Name of Tenant (tenantName)
2. Email of Tenant (tenantEmail) - if not found in the document, generate a professional one based on their name.
3. Unit Number (unitNumber) - e.g., "A-101", "B-205". Default to "A-101" if not found.
4. Monthly Rent (monthlyRent) - extract the number only, remove any currency symbols, commas, dots, or suffixes.
5. Security Deposit (securityDeposit) - extract the number only. If not specified, default to the monthly rent amount.
6. Billing Day of Month (billingDay) - extract as a number (1-31). Default to 1.
7. Start Date (startDate) - Format: YYYY-MM-DD. Default to "2026-07-01".
8. End Date (endDate) - Format: YYYY-MM-DD. Default to "2027-07-01".

File Name: ${fileName || "document"}

Return the output STRICTLY as a valid JSON object with the following keys and no extra characters or markdown wrapping like \`\`\`json:
{
  "tenantName": "...",
  "tenantEmail": "...",
  "unitNumber": "...",
  "monthlyRent": "...",
  "securityDeposit": "...",
  "billingDay": 1,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}`;

    const contents: any[] = [];

    // If we have base64 file data, send it to Gemini as inlineData!
    if (fileBase64 && fileMimeType) {
      contents.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64
        }
      });
    }

    if (text) {
      contents.push({
        text: `Text Content of document:\n${text}\n\n${prompt}`
      });
    } else {
      contents.push({
        text: prompt
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const contentText = response.text || "";
    // Clean JSON wrapping
    const cleanJsonStr = contentText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const result = JSON.parse(cleanJsonStr);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Lease Extraction Error:", error);
    res.status(500).json({ error: "Failed to extract lease details: " + error.message });
  }
});

// 3. Lease Smart Analyzer and Recommendations
app.post("/api/gemini/analyze-lease", async (req, res) => {
  const { propertyName, tenantName, monthlyRent, securityDeposit, startDate, endDate, billingDay } = req.body;

  if (!propertyName || !tenantName || !monthlyRent) {
    return res.status(400).json({ error: "Missing lease details to analyze." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const mockAnalysis = `### 📋 Lease Agreement Smart Analysis

#### **Financial Risk Assessment**
- **Monthly Rent:** $${monthlyRent}
- **Security Deposit:** $${securityDeposit || "Not Specified"} (Recommended: 1.5x - 2x rent, which would be $${(Number(monthlyRent) * 1.5).toFixed(2)})
- **Billing Day:** Day ${billingDay || 1} of the month.

#### **Compliance & Rule Recommendations**
1. **Security Deposit Check:** The security deposit provided is adequate, but ensure it is stored in an escrow account complying with local tenancy laws.
2. **Late Fee Clause:** Standard tenancy laws suggest a grace period of 3-5 days. If payment is not received by day ${Number(billingDay || 1) + 5}, a standard 5% late fee is highly recommended.
3. **Insurance Clause:** Recommend requiring the tenant to carry **Renter's Insurance (minimum $100k liability)** and provide proof before moving in.
4. **Maintenance Responsibility:** Clearly delineate minor maintenance (tenant's duty, e.g., bulbs, filters, up to $100) vs. major maintenance (landlord's duty).

*Disclaimer: This is an AI-generated advisory notice. Please consult a legal professional before finalizing formal lease agreements.*`;
    return res.json({ analysis: mockAnalysis, isMock: true });
  }

  try {
    const ai = getAi();
    const prompt = `You are a master real estate legal advisor and property risk manager.
Analyze the following lease agreement details and provide a professional risk assessment and recommended protective clauses:
Property Name: ${propertyName}
Tenant Name: ${tenantName}
Monthly Rent: $${monthlyRent}
Security Deposit: $${securityDeposit || "N/A"}
Start Date: ${startDate}
End Date: ${endDate}
Billing Day: Day ${billingDay || 1} of the month

Provide your analysis structured with clean Markdown:
1. **Financial Assessment**: Review if the deposit is appropriate (typically 1.5x to 2x rent). Review payment risk.
2. **Key Protective Clauses**: Recommend 3-4 standard, robust clauses (e.g., late fees, renter's insurance, maintenance limits, subletting).
3. **Compliance Milestones**: Mention compliance checks to monitor (e.g. check-in inspection, safety certifications).
4. **Risk Rating**: Assign a low, medium, or high operational risk rating with a brief justification.

Ensure the tone is analytical, expert, and highly practical. Formatting must be clear Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text || "Failed to generate lease analysis.", isMock: false });
  } catch (error: any) {
    console.error("Gemini Lease Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze lease due to an internal error: " + error.message });
  }
});

// 4. Multi-Tenant Portfolio AI Insights
app.post("/api/gemini/portfolio-insights", async (req, res) => {
  const { leases, payments, compliance } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const mockInsights = `### 🏢 Real-Time Portfolio Insights

#### **Financial Status**
- **Outstanding Balance:** Healthy overall. 
- **Late Payments:** Currently minor. Keep an eye on late paying patterns to avoid rent arrears.

#### **Tenant Compliance Radar**
- **Noise & Maintenance Complaints:** Resolved compliance rate is high. 
- **Recommendation:** Implement a quarterly proactive property walk-through to prevent minor compliance issues from escalating into expensive maintenance problems.

#### **Management Actions Checklist**
1. 📞 Contact tenants with overdue payments immediately.
2. 📝 Draft warning letters for escalating noise or pet violations.
3. 🔔 Prepare renewal notices for leases expiring within the next 60 days.`;

    return res.json({ insights: mockInsights, isMock: true });
  }

  try {
    const ai = getAi();
    const summaryPrompt = `You are the executive advisor for a real-estate investment trust and residential building portfolio.
Review the following live building summary metrics:
Total Active Leases: ${leases?.length || 0}
Total Payments Tracked: ${payments?.length || 0}
Total Compliance Issues: ${compliance?.length || 0}

Detailed Items:
Leases List: ${JSON.stringify((leases || []).map((l: any) => ({ tenant: l.tenantName, status: l.status, rent: l.monthlyRent, compliance: l.complianceStatus })))}
Payments List: ${JSON.stringify((payments || []).map((p: any) => ({ tenant: p.tenantName, amount: p.amount, status: p.status, dueDate: p.dueDate })))}
Compliance List: ${JSON.stringify((compliance || []).map((c: any) => ({ tenant: c.tenantName, category: c.category, severity: c.severity, status: c.status })))}

Generate a brief, highly actionable strategic portfolio brief in Markdown format:
1. **Billing & Revenue Health**: Assess real-time rental recovery, identify late or partial payment hotspots.
2. **Tenant Compliance Alert**: Highlight any critical or high-severity compliance incidents (e.g. noise, unauthorized occupancy) that need urgent management attention.
3. **Immediate Operational Interventions**: Suggest 3 specific, priority-ranked tasks for the property manager today (e.g., follow-up calls, notice delivery).

Keep the summary tightly focused, practical, and punchy. No generic fluff.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: summaryPrompt,
    });

    res.json({ insights: response.text || "Failed to generate portfolio insights.", isMock: false });
  } catch (error: any) {
    console.error("Gemini Portfolio Insights Error:", error);
    res.status(500).json({ error: "Failed to generate portfolio insights: " + error.message });
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
    // Serve index.html for all client-side SPA routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
