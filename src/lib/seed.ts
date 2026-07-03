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
  Notification 
} from "../types";

export const sampleBuildings: Building[] = [
  {
    id: "bld-ventura",
    name: "Ventura",
    address: "Jl. TB Simatupang No.26, Cilandak, Jakarta Selatan",
    totalFloors: 12,
    totalUnits: 48,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    description: "Gedung perkantoran modern kelas-A yang terletak di koridor bisnis TB Simatupang dengan akses mudah ke tol JORR.",
    createdBy: "system-seed",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "bld-tifa",
    name: "TIFA Building",
    address: "Jl. Kuningan Barat No.26, Mampang Prapatan, Jakarta Selatan",
    totalFloors: 10,
    totalUnits: 40,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    description: "Gedung perkantoran ikonik di Jakarta Selatan yang menjadi pusat perusahaan teknologi, media, dan telekomunikasi.",
    createdBy: "system-seed",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "bld-alamanda",
    name: "Alamanda",
    address: "Jl. TB Simatupang No.21, Cilandak, Jakarta Selatan",
    totalFloors: 15,
    totalUnits: 60,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    description: "Menara perkantoran premium dengan standar fasilitas tinggi, ruang hijau yang asri, serta teknologi smart building.",
    createdBy: "system-seed",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "bld-gbs",
    name: "GBS Surabaya",
    address: "Jl. Ahmad Yani No.88, Gayungan, Surabaya",
    totalFloors: 8,
    totalUnits: 32,
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
    description: "Pusat bisnis dan komersial terpadu di Surabaya Selatan, dirancang khusus untuk operasional korporasi skala regional.",
    createdBy: "system-seed",
    createdAt: "2026-01-01T00:00:00Z"
  }
];

export const sampleFloors: Floor[] = [
  // TIFA Floors
  { id: "flr-tifa-1", buildingId: "bld-tifa", buildingName: "TIFA Building", floorNumber: "01", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "flr-tifa-2", buildingId: "bld-tifa", buildingName: "TIFA Building", floorNumber: "02", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "flr-tifa-3", buildingId: "bld-tifa", buildingName: "TIFA Building", floorNumber: "03", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  // Ventura Floors
  { id: "flr-ventura-1", buildingId: "bld-ventura", buildingName: "Ventura", floorNumber: "01", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "flr-ventura-2", buildingId: "bld-ventura", buildingName: "Ventura", floorNumber: "02", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  // Alamanda Floors
  { id: "flr-alamanda-1", buildingId: "bld-alamanda", buildingName: "Alamanda", floorNumber: "01", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "flr-alamanda-2", buildingId: "bld-alamanda", buildingName: "Alamanda", floorNumber: "02", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  // GBS Floors
  { id: "flr-gbs-1", buildingId: "bld-gbs", buildingName: "GBS Surabaya", floorNumber: "01", totalUnits: 4, createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" }
];

export const sampleUnits: Unit[] = [
  // TIFA Units
  { id: "unit-tifa-101", buildingId: "bld-tifa", buildingName: "TIFA Building", floorId: "flr-tifa-1", floorNumber: "01", unitNumber: "Suite 101", areaSqm: 150, rentPerSqm: 220000, status: "leased", description: "Lobby-facing prime retail or premium corporate branch office space.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-tifa-102", buildingId: "bld-tifa", buildingName: "TIFA Building", floorId: "flr-tifa-1", floorNumber: "01", unitNumber: "Suite 102", areaSqm: 120, rentPerSqm: 200000, status: "empty", description: "Standard retail space with direct hallway access.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-tifa-201", buildingId: "bld-tifa", buildingName: "TIFA Building", floorId: "flr-tifa-2", floorNumber: "02", unitNumber: "Suite 201", areaSqm: 350, rentPerSqm: 180000, status: "leased", description: "West wing office space with abundant natural light.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-tifa-202", buildingId: "bld-tifa", buildingName: "TIFA Building", floorId: "flr-tifa-2", floorNumber: "02", unitNumber: "Suite 202", areaSqm: 280, rentPerSqm: 180000, status: "empty", description: "Fully carpeted layout with partitions and meeting rooms.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-tifa-301", buildingId: "bld-tifa", buildingName: "TIFA Building", floorId: "flr-tifa-3", floorNumber: "03", unitNumber: "Suite 301", areaSqm: 450, rentPerSqm: 175000, status: "maintenance", description: "Large corner office unit currently undergoing AC and wiring upgrades.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },

  // Ventura Units
  { id: "unit-ventura-101", buildingId: "bld-ventura", buildingName: "Ventura", floorId: "flr-ventura-1", floorNumber: "01", unitNumber: "Suite 101", areaSqm: 180, rentPerSqm: 240000, status: "leased", description: "Ground floor unit next to Main Reception. High traffic area.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-ventura-201", buildingId: "bld-ventura", buildingName: "Ventura", floorId: "flr-ventura-2", floorNumber: "02", unitNumber: "Suite 201", areaSqm: 300, rentPerSqm: 200000, status: "leased", description: "Medium-sized office layout with pantry and director room.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-ventura-202", buildingId: "bld-ventura", buildingName: "Ventura", floorId: "flr-ventura-2", floorNumber: "02", unitNumber: "Suite 202", areaSqm: 220, rentPerSqm: 200000, status: "empty", description: "Bare shell unit ready for custom interior design fit-out.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },

  // Alamanda Units
  { id: "unit-alamanda-101", buildingId: "bld-alamanda", buildingName: "Alamanda", floorId: "flr-alamanda-1", floorNumber: "01", unitNumber: "Suite 101", areaSqm: 210, rentPerSqm: 250000, status: "leased", description: "Premium coffee shop and retail space in Main Lobby.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "unit-alamanda-201", buildingId: "bld-alamanda", buildingName: "Alamanda", floorId: "flr-alamanda-2", floorNumber: "02", unitNumber: "Suite 201", areaSqm: 400, rentPerSqm: 210000, status: "empty", description: "Spacious layout with city view and executive restrooms.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" },

  // GBS Units
  { id: "unit-gbs-101", buildingId: "bld-gbs", buildingName: "GBS Surabaya", floorId: "flr-gbs-1", floorNumber: "01", unitNumber: "Suite 101", areaSqm: 160, rentPerSqm: 150000, status: "leased", description: "Ground floor unit, ideal for banking center or tech showroom.", createdBy: "system-seed", createdAt: "2026-01-01T00:00:00Z" }
];

export const sampleTenants: Tenant[] = [
  {
    id: "ten-medidata",
    companyName: "PT Medidata Indonesia",
    contactPerson: "Rizky Pratama",
    email: "finance@medidata.co.id",
    phone: "021-52901234",
    sector: "Teknologi & Informasi",
    createdBy: "system-seed",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "ten-goto",
    companyName: "GoTo Group HQ",
    contactPerson: "Nadiem Anwar",
    email: "facilities@goto.com",
    phone: "021-72213324",
    sector: "Teknologi & Informasi",
    createdBy: "system-seed",
    createdAt: "2026-01-12T09:00:00Z"
  },
  {
    id: "ten-kopi",
    companyName: "PT Kopi Jiwa Sejahtera (Kopi Kenangan)",
    contactPerson: "Edward Tirtanata",
    email: "partnership@kopikenangan.id",
    phone: "0811-9234567",
    sector: "F&B / Kuliner",
    createdBy: "system-seed",
    createdAt: "2026-02-01T11:00:00Z"
  },
  {
    id: "ten-astra",
    companyName: "Astra International - Logistics Dept",
    contactPerson: "Budi Santoso",
    email: "ops.logistic@astra.co.id",
    phone: "021-6522525",
    sector: "Logistik & Transportasi",
    createdBy: "system-seed",
    createdAt: "2026-02-15T10:00:00Z"
  }
];

export const sampleLeases: Lease[] = [
  {
    id: "lease-101",
    tenantId: "ten-medidata",
    tenantName: "PT Medidata Indonesia",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    unitId: "unit-tifa-201",
    unitNumber: "Suite 201",
    floorNumber: "02",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    monthlyRent: 63000000, // 350 sqm * 180,000 IDR
    securityDeposit: 126000000, // 2x rent
    billingDay: 5,
    status: "active",
    approvalStage: "completed",
    googleDriveUrl: "https://drive.google.com/drive/folders/ventura-tifa-contracts-101",
    createdAt: "2025-12-15T14:00:00Z",
    createdBy: "system-seed"
  },
  {
    id: "lease-102",
    tenantId: "ten-goto",
    tenantName: "GoTo Group HQ",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    unitId: "unit-tifa-101",
    unitNumber: "Suite 101",
    floorNumber: "01",
    startDate: "2026-02-01",
    endDate: "2028-01-31",
    monthlyRent: 33000000, // 150 sqm * 220,000 IDR
    securityDeposit: 66000000,
    billingDay: 1,
    status: "active",
    approvalStage: "completed",
    googleDriveUrl: "https://drive.google.com/drive/folders/ventura-tifa-contracts-102",
    createdAt: "2026-01-20T10:00:00Z",
    createdBy: "system-seed"
  },
  {
    id: "lease-103",
    tenantId: "ten-kopi",
    tenantName: "PT Kopi Jiwa Sejahtera (Kopi Kenangan)",
    buildingId: "bld-alamanda",
    buildingName: "Alamanda",
    unitId: "unit-alamanda-101",
    unitNumber: "Suite 101",
    floorNumber: "01",
    startDate: "2026-03-01",
    endDate: "2027-02-28",
    monthlyRent: 52500000, // 210 sqm * 250,000 IDR
    securityDeposit: 105000000,
    billingDay: 10,
    status: "active",
    approvalStage: "completed",
    googleDriveUrl: "https://drive.google.com/drive/folders/alamanda-contracts-kopi",
    createdAt: "2026-02-10T11:45:00Z",
    createdBy: "system-seed"
  },
  {
    id: "lease-104",
    tenantId: "ten-astra",
    tenantName: "Astra International - Logistics Dept",
    buildingId: "bld-ventura",
    buildingName: "Ventura",
    unitId: "unit-ventura-201",
    unitNumber: "Suite 201",
    floorNumber: "02",
    startDate: "2026-02-15",
    endDate: "2027-02-14",
    monthlyRent: 60000000, // 300 sqm * 200,000 IDR
    securityDeposit: 120000000,
    billingDay: 15,
    status: "active",
    approvalStage: "completed",
    googleDriveUrl: "https://drive.google.com/drive/folders/ventura-contracts-astra",
    createdAt: "2026-02-01T15:30:00Z",
    createdBy: "system-seed"
  }
];

export const samplePayments: Payment[] = [
  // Medidata payments
  {
    id: "pay-101",
    leaseId: "lease-101",
    tenantId: "ten-medidata",
    tenantName: "PT Medidata Indonesia",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    unitNumber: "Suite 201",
    amount: 63000000,
    dueDate: "2026-05-05",
    paymentDate: "2026-05-04",
    status: "paid",
    method: "bank_transfer",
    notes: "Rental payment for May 2026. Inv #202605-MED1",
    createdAt: "2026-05-04T09:00:00Z"
  },
  {
    id: "pay-102",
    leaseId: "lease-101",
    tenantId: "ten-medidata",
    tenantName: "PT Medidata Indonesia",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    unitNumber: "Suite 201",
    amount: 63000000,
    dueDate: "2026-06-05",
    paymentDate: "2026-06-05",
    status: "paid",
    method: "bank_transfer",
    notes: "Rental payment for June 2026. Inv #202606-MED1",
    createdAt: "2026-06-05T10:15:00Z"
  },
  {
    id: "pay-103",
    leaseId: "lease-101",
    tenantId: "ten-medidata",
    tenantName: "PT Medidata Indonesia",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    unitNumber: "Suite 201",
    amount: 63000000,
    dueDate: "2026-07-05",
    status: "overdue",
    notes: "Waiting for finance release from tenant HQ.",
    createdAt: "2026-06-30T10:00:00Z"
  }
];

export const sampleDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Sewa_TIFA_Suite_201_Medidata.pdf",
    type: "application/pdf",
    size: "4.2 MB",
    googleDriveUrl: "https://drive.google.com/file/d/1B7u2Bf_xSDFgqwer789tyu/view",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    tenantId: "ten-medidata",
    tenantName: "PT Medidata Indonesia",
    leaseId: "lease-101",
    uploadedAt: "2026-01-02T10:00:00Z"
  },
  {
    id: "doc-2",
    name: "Lobby_Retail_GoTo_Approved.pdf",
    type: "application/pdf",
    size: "3.8 MB",
    googleDriveUrl: "https://drive.google.com/file/d/1H7u8Bf_xSDFgcvfd456tyu/view",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    tenantId: "ten-goto",
    tenantName: "GoTo Group HQ",
    leaseId: "lease-102",
    uploadedAt: "2026-01-21T11:30:00Z"
  },
  {
    id: "doc-3",
    name: "Draft_Lease_TIFA_Suite_102_Empty.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: "520 KB",
    googleDriveUrl: "https://drive.google.com/file/d/1X9u1Bf_xSDFgmock321zxc/view",
    buildingId: "bld-tifa",
    buildingName: "TIFA Building",
    uploadedAt: "2026-06-25T14:45:00Z"
  }
];

export const sampleAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    action: "LEASE_CREATE",
    user: "Ahmad Legal (Legal Reviewer)",
    module: "Lease & Contract",
    timestamp: "2026-07-02T10:30:00Z",
    details: "Membuat draft kontrak sewa baru untuk unit TIFA Suite 101, Tenant GoTo Group HQ"
  },
  {
    id: "log-2",
    action: "AI_CONTRACT_OCR",
    user: "Siti Amelia (Property Manager)",
    module: "AI Contract Intelligence",
    timestamp: "2026-07-02T11:15:00Z",
    details: "Melakukan OCR dan ekstraksi otomatis pada file Sewa_TIFA_Suite_201_Medidata.pdf dengan Confidence Score 96.5%"
  },
  {
    id: "log-3",
    action: "PAYMENT_VERIFIED",
    user: "Rizky Finance (Finance Officer)",
    module: "Payments & Billings",
    timestamp: "2026-07-02T14:20:00Z",
    details: "Memverifikasi transfer bank sewa bulan Juni 2026 dari PT Medidata Indonesia sebesar Rp 63.000.000"
  }
];

export const sampleWorkflows: ApprovalWorkflow[] = [
  {
    id: "wf-1",
    leaseId: "lease-101",
    tenantName: "PT Medidata Indonesia",
    buildingName: "TIFA Building",
    unitNumber: "Suite 201",
    requestedBy: "Siti Amelia",
    requestedAt: "2026-06-28T09:00:00Z",
    stage: "legal",
    status: "approved",
    comments: "Dokumen pasal hukum, ganti rugi, dan klausul sewa telah sesuai dengan standar TPMS Enterprise."
  },
  {
    id: "wf-2",
    leaseId: "lease-101",
    tenantName: "PT Medidata Indonesia",
    buildingName: "TIFA Building",
    unitNumber: "Suite 201",
    requestedBy: "Siti Amelia",
    requestedAt: "2026-06-29T10:00:00Z",
    stage: "finance",
    status: "approved",
    comments: "Pembayaran uang jaminan (Security Deposit) sebesar Rp 126.000.000 telah terverifikasi di rekening penampung."
  }
];

export const sampleNotifications: Notification[] = [
  {
    id: "not-1",
    title: "Kontrak Mendekati Expired",
    message: "Kontrak sewa Astra International di Ventura Suite 201 akan berakhir dalam 60 hari (14 Februari 2027).",
    date: "2026-07-03T08:00:00Z",
    read: false,
    type: "expiry"
  },
  {
    id: "not-2",
    title: "Overdue Billing Alert",
    message: "PT Medidata Indonesia belum melunasi tagihan sewa TIFA Suite 201 yang jatuh tempo pada 5 Juli 2026.",
    date: "2026-07-03T09:30:00Z",
    read: false,
    type: "payment"
  },
  {
    id: "not-3",
    title: "Persetujuan Kontrak Baru",
    message: "Draft sewa baru untuk TIFA Suite 102 (Tenant PT Indofood) menunggu persetujuan Legal Reviewer.",
    date: "2026-07-02T15:45:00Z",
    read: true,
    type: "approval"
  }
];
