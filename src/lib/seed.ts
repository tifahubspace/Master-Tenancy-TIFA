import { collection, getDocs, setDoc, doc, query, limit } from "firebase/firestore";
import { Firestore } from "firebase/firestore";
import { Property, Lease, Payment, Compliance } from "../types";

export const sampleProperties: Property[] = [
  {
    id: "prop-1",
    name: "Sudirman Tower A",
    address: "Jl. Jenderal Sudirman No.21, Karet Semanggi, Jakarta Selatan",
    totalUnits: 40,
    createdBy: "admin-seed",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "prop-2",
    name: "Menara Kuningan",
    address: "Jl. H. R. Rasuna Said No.5, Kuningan, Jakarta Selatan",
    totalUnits: 25,
    createdBy: "admin-seed",
    createdAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "prop-3",
    name: "Apartemen Kelapa Gading",
    address: "Jl. Boulevard Barat Raya Blok LC7, Kelapa Gading, Jakarta Utara",
    totalUnits: 60,
    createdBy: "admin-seed",
    createdAt: "2026-03-01T10:00:00Z"
  },
  {
    id: "prop-4",
    name: "Wisma Barito Pacific",
    address: "Jl. Letjen S. Parman Kav. 62, Slipi, Jakarta Barat",
    totalUnits: 18,
    createdBy: "admin-seed",
    createdAt: "2026-03-05T11:00:00Z"
  }
];

export const sampleLeases: Lease[] = [
  {
    id: "lease-101",
    tenantId: "tenant-aditya",
    tenantName: "Aditya Wijaya",
    tenantEmail: "aditya.wijaya@gmail.com",
    propertyId: "prop-1",
    propertyName: "Sudirman Tower A",
    unitNumber: "A-101",
    startDate: "2026-01-01",
    endDate: "2027-01-01",
    monthlyRent: 15000000,
    securityDeposit: 30000000,
    billingDay: 1,
    status: "active",
    complianceStatus: "compliant",
    createdAt: "2025-12-15T14:00:00Z"
  },
  {
    id: "lease-205",
    tenantId: "tenant-dewi",
    tenantName: "Dewi Lestari",
    tenantEmail: "dewi.lestari@starkindo.id",
    propertyId: "prop-2",
    propertyName: "Menara Kuningan",
    unitNumber: "T-205",
    startDate: "2026-02-01",
    endDate: "2027-02-01",
    monthlyRent: 22000000,
    securityDeposit: 44000000,
    billingDay: 1,
    status: "active",
    complianceStatus: "compliant",
    createdAt: "2026-01-25T10:00:00Z"
  },
  {
    id: "lease-302",
    tenantId: "tenant-budi",
    tenantName: "Budi Santoso",
    tenantEmail: "budi.santoso@indocorp.co.id",
    propertyId: "prop-3",
    propertyName: "Apartemen Kelapa Gading",
    unitNumber: "PH-302",
    startDate: "2026-03-01",
    endDate: "2028-03-01",
    monthlyRent: 12500000,
    securityDeposit: 25000000,
    billingDay: 1,
    status: "active",
    complianceStatus: "pending_review",
    createdAt: "2026-02-20T11:45:00Z"
  },
  {
    id: "lease-104",
    tenantId: "tenant-reza",
    tenantName: "Reza Pratama",
    tenantEmail: "reza.pratama@mail.id",
    propertyId: "prop-4",
    propertyName: "Wisma Barito Pacific",
    unitNumber: "B-104",
    startDate: "2026-02-15",
    endDate: "2027-02-15",
    monthlyRent: 18000000,
    securityDeposit: 18000000,
    billingDay: 15,
    status: "active",
    complianceStatus: "non_compliant",
    createdAt: "2026-02-10T16:20:00Z"
  }
];

export const samplePayments: Payment[] = [
  // Aditya Wijaya Payments
  {
    id: "pay-101-jan",
    leaseId: "lease-101",
    tenantId: "tenant-aditya",
    tenantName: "Aditya Wijaya",
    propertyId: "prop-1",
    propertyName: "Sudirman Tower A",
    unitNumber: "A-101",
    amount: 15000000,
    dueDate: "2026-01-01",
    paymentDate: "2026-01-02",
    status: "paid",
    method: "bank_transfer",
    notes: "Pembayaran Sewa Januari.",
    createdAt: "2026-01-02T10:30:00Z"
  },
  {
    id: "pay-101-feb",
    leaseId: "lease-101",
    tenantId: "tenant-aditya",
    tenantName: "Aditya Wijaya",
    propertyId: "prop-1",
    propertyName: "Sudirman Tower A",
    unitNumber: "A-101",
    amount: 15000000,
    dueDate: "2026-02-01",
    paymentDate: "2026-02-01",
    status: "paid",
    method: "bank_transfer",
    notes: "Auto-debit berhasil diproses.",
    createdAt: "2026-02-01T08:00:00Z"
  },
  {
    id: "pay-101-mar",
    leaseId: "lease-101",
    tenantId: "tenant-aditya",
    tenantName: "Aditya Wijaya",
    propertyId: "prop-1",
    propertyName: "Sudirman Tower A",
    unitNumber: "A-101",
    amount: 15000000,
    dueDate: "2026-03-01",
    paymentDate: "2026-03-05",
    status: "late",
    method: "bank_transfer",
    notes: "Terlambat karena libur proses perbankan.",
    createdAt: "2026-03-05T15:40:00Z"
  },
  // Budi Santoso Payments
  {
    id: "pay-302-mar",
    leaseId: "lease-302",
    tenantId: "tenant-budi",
    tenantName: "Budi Santoso",
    propertyId: "prop-3",
    propertyName: "Apartemen Kelapa Gading",
    unitNumber: "PH-302",
    amount: 12500000,
    dueDate: "2026-03-01",
    paymentDate: "2026-02-28",
    status: "paid",
    method: "bank_transfer",
    notes: "Pembayaran sewa awal Maret dan deposit.",
    createdAt: "2026-02-28T17:15:00Z"
  },
  // Reza Pratama Payments
  {
    id: "pay-104-feb",
    leaseId: "lease-104",
    tenantId: "tenant-reza",
    tenantName: "Reza Pratama",
    propertyId: "prop-4",
    propertyName: "Wisma Barito Pacific",
    unitNumber: "B-104",
    amount: 18000000,
    dueDate: "2026-02-15",
    paymentDate: "2026-02-18",
    status: "late",
    method: "bank_transfer",
    notes: "Transfer bank, mohon maaf atas keterlambatan.",
    createdAt: "2026-02-18T12:00:00Z"
  },
  {
    id: "pay-104-mar",
    leaseId: "lease-104",
    tenantId: "tenant-reza",
    tenantName: "Reza Pratama",
    propertyId: "prop-4",
    propertyName: "Wisma Barito Pacific",
    unitNumber: "B-104",
    amount: 18000000,
    dueDate: "2026-03-15",
    status: "overdue",
    notes: "Menunggu pembayaran sewa. Penyewa responsif namun terkendala cash flow.",
    createdAt: "2026-03-16T09:00:00Z"
  }
];

export const sampleCompliance: Compliance[] = [
  {
    id: "comp-1",
    leaseId: "lease-104",
    tenantId: "tenant-reza",
    tenantName: "Reza Pratama",
    propertyId: "prop-4",
    propertyName: "Wisma Barito Pacific",
    unitNumber: "B-104",
    category: "noise",
    severity: "medium",
    status: "warning_issued",
    details: "Beberapa tetangga melaporkan kebisingan aktivitas pengerjaan kayu larut malam di Unit B-104. Penyewa mengklaim sedang merakit dekorasi pameran pribadi.",
    reportedBy: "Building Security",
    dateReported: "2026-02-28",
    createdAt: "2026-02-28T23:30:00Z"
  },
  {
    id: "comp-2",
    leaseId: "lease-302",
    tenantId: "tenant-budi",
    tenantName: "Budi Santoso",
    propertyId: "prop-3",
    propertyName: "Apartemen Kelapa Gading",
    unitNumber: "PH-302",
    category: "other",
    severity: "low",
    status: "under_review",
    details: "Pengiriman barang berat berkapasitas besar menggunakan lift penumpang tanpa izin tertulis manajemen gedung. Membutuhkan verifikasi tata tertib.",
    reportedBy: "Staff Lobby",
    dateReported: "2026-03-04",
    createdAt: "2026-03-04T14:15:00Z"
  },
  {
    id: "comp-3",
    leaseId: "lease-205",
    tenantId: "tenant-dewi",
    tenantName: "Dewi Lestari",
    propertyId: "prop-2",
    propertyName: "Menara Kuningan",
    unitNumber: "T-205",
    category: "maintenance",
    severity: "high",
    status: "resolved",
    details: "Lonjakan beban listrik ekstrem terdaftar di unit T-205 menyebabkan saklar sirkuit utama trip di blok sebelah. Pemeriksaan teknis menemukan pemasangan server tanpa izin.",
    reportedBy: "Property Engineer",
    dateReported: "2026-02-10",
    resolvedDate: "2026-02-14",
    createdAt: "2026-02-10T11:00:00Z"
  }
];

export async function seedDatabaseIfEmpty(db: Firestore) {
  // Not used directly but kept for safety/fallback references.
}
