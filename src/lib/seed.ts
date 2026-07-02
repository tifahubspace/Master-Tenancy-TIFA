import { collection, getDocs, setDoc, doc, query, limit } from "firebase/firestore";
import { Firestore } from "firebase/firestore";
import { Property, Lease, Payment, Compliance } from "../types";

export const sampleProperties: Property[] = [
  {
    id: "prop-1",
    name: "Oakridge Heights Apartments",
    address: "742 Evergreen Terrace, Springfield",
    totalUnits: 24,
    createdBy: "admin-seed",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "prop-2",
    name: "Sylvan Ridge Townhomes",
    address: "1012 Cascade Boulevard, Seattle",
    totalUnits: 12,
    createdBy: "admin-seed",
    createdAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "prop-3",
    name: "The Meridian Penthouse Complex",
    address: "500 Broadway Avenue, New York",
    totalUnits: 8,
    createdBy: "admin-seed",
    createdAt: "2026-03-01T10:00:00Z"
  }
];

export const sampleLeases: Lease[] = [
  {
    id: "lease-101",
    tenantId: "tenant-sarah",
    tenantName: "Sarah Connor",
    tenantEmail: "sarah.connor@cyberdyne.org",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "A-101",
    startDate: "2026-01-01",
    endDate: "2027-01-01",
    monthlyRent: 1850,
    securityDeposit: 2500,
    billingDay: 1,
    status: "active",
    complianceStatus: "compliant",
    createdAt: "2025-12-15T14:00:00Z"
  },
  {
    id: "lease-302",
    tenantId: "tenant-bruce",
    tenantName: "Bruce Wayne",
    tenantEmail: "bruce@waynecorp.com",
    propertyId: "prop-3",
    propertyName: "The Meridian Penthouse Complex",
    unitNumber: "PH-302",
    startDate: "2026-03-01",
    endDate: "2028-03-01",
    monthlyRent: 8500,
    securityDeposit: 17000,
    billingDay: 1,
    status: "active",
    complianceStatus: "pending_review",
    createdAt: "2026-02-20T11:45:00Z"
  },
  {
    id: "lease-104",
    tenantId: "tenant-peter",
    tenantName: "Peter Parker",
    tenantEmail: "peter.parker@dailybugle.net",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "B-104",
    startDate: "2026-02-15",
    endDate: "2027-02-15",
    monthlyRent: 1200,
    securityDeposit: 1200,
    billingDay: 15,
    status: "active",
    complianceStatus: "non_compliant",
    createdAt: "2026-02-10T16:20:00Z"
  },
  {
    id: "lease-205",
    tenantId: "tenant-tony",
    tenantName: "Tony Stark",
    tenantEmail: "tony@starkindustries.com",
    propertyId: "prop-2",
    propertyName: "Sylvan Ridge Townhomes",
    unitNumber: "T-205",
    startDate: "2026-02-01",
    endDate: "2027-02-01",
    monthlyRent: 3400,
    securityDeposit: 5000,
    billingDay: 1,
    status: "active",
    complianceStatus: "compliant",
    createdAt: "2026-01-25T10:00:00Z"
  }
];

export const samplePayments: Payment[] = [
  // Sarah Connor Payments
  {
    id: "pay-101-jan",
    leaseId: "lease-101",
    tenantId: "tenant-sarah",
    tenantName: "Sarah Connor",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "A-101",
    amount: 1850,
    dueDate: "2026-01-01",
    paymentDate: "2026-01-02",
    status: "paid",
    method: "bank_transfer",
    notes: "Regular January Rent payment.",
    createdAt: "2026-01-02T10:30:00Z"
  },
  {
    id: "pay-101-feb",
    leaseId: "lease-101",
    tenantId: "tenant-sarah",
    tenantName: "Sarah Connor",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "A-101",
    amount: 1850,
    dueDate: "2026-02-01",
    paymentDate: "2026-02-01",
    status: "paid",
    method: "bank_transfer",
    notes: "Auto-debit processed successfully.",
    createdAt: "2026-02-01T08:00:00Z"
  },
  {
    id: "pay-101-mar",
    leaseId: "lease-101",
    tenantId: "tenant-sarah",
    tenantName: "Sarah Connor",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "A-101",
    amount: 1850,
    dueDate: "2026-03-01",
    paymentDate: "2026-03-05",
    status: "late",
    method: "bank_transfer",
    notes: "Delayed due to bank holiday processing.",
    createdAt: "2026-03-05T15:40:00Z"
  },
  // Bruce Wayne Payments
  {
    id: "pay-302-mar",
    leaseId: "lease-302",
    tenantId: "tenant-bruce",
    tenantName: "Bruce Wayne",
    propertyId: "prop-3",
    propertyName: "The Meridian Penthouse Complex",
    unitNumber: "PH-302",
    amount: 8500,
    dueDate: "2026-03-01",
    paymentDate: "2026-02-28",
    status: "paid",
    method: "bank_transfer",
    notes: "Pre-paid March rent and deposit transfer.",
    createdAt: "2026-02-28T17:15:00Z"
  },
  // Peter Parker Payments
  {
    id: "pay-104-feb",
    leaseId: "lease-104",
    tenantId: "tenant-peter",
    tenantName: "Peter Parker",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "B-104",
    amount: 1200,
    dueDate: "2026-02-15",
    paymentDate: "2026-02-18",
    status: "late",
    method: "cash",
    notes: "Handed over cash, apologize for delay.",
    createdAt: "2026-02-18T12:00:00Z"
  },
  {
    id: "pay-104-mar",
    leaseId: "lease-104",
    tenantId: "tenant-peter",
    tenantName: "Peter Parker",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "B-104",
    amount: 1200,
    dueDate: "2026-03-15",
    status: "overdue",
    notes: "Awaiting payment. Tenant responsive but short of cash.",
    createdAt: "2026-03-16T09:00:00Z"
  }
];

export const sampleCompliance: Compliance[] = [
  {
    id: "comp-1",
    leaseId: "lease-104",
    tenantId: "tenant-peter",
    tenantName: "Peter Parker",
    propertyId: "prop-1",
    propertyName: "Oakridge Heights Apartments",
    unitNumber: "B-104",
    category: "noise",
    severity: "medium",
    status: "warning_issued",
    details: "Multiple neighbors reported high-volume drilling, camera flashes, and mechanical hums coming from B-104 past midnight. Tenant claimed he was 'developing film' and repairing minor equipment.",
    reportedBy: "Building Security",
    dateReported: "2026-02-28",
    createdAt: "2026-02-28T23:30:00Z"
  },
  {
    id: "comp-2",
    leaseId: "lease-302",
    tenantId: "tenant-bruce",
    tenantName: "Bruce Wayne",
    propertyId: "prop-3",
    propertyName: "The Meridian Penthouse Complex",
    unitNumber: "PH-302",
    category: "other",
    severity: "low",
    status: "under_review",
    details: "Unusual industrial delivery arriving at Penthouse service elevator: large steel cases marked 'Wayne Enterprises Advanced Tech R&D'. Unit has strict residential zoning rules. Checking if equipment violates lease rules.",
    reportedBy: "Service Staff",
    dateReported: "2026-03-04",
    createdAt: "2026-03-04T14:15:00Z"
  },
  {
    id: "comp-3",
    leaseId: "lease-205",
    tenantId: "tenant-tony",
    tenantName: "Tony Stark",
    propertyId: "prop-2",
    propertyName: "Sylvan Ridge Townhomes",
    unitNumber: "T-205",
    category: "maintenance",
    severity: "high",
    status: "resolved",
    details: "Extreme power surges registered at unit T-205 leading to circuit tripping across three surrounding units. Inspection revealed unauthorized custom server-rack sub-stations in garage.",
    reportedBy: "Property Engineer",
    dateReported: "2026-02-10",
    resolvedDate: "2026-02-14",
    createdAt: "2026-02-10T11:00:00Z"
  }
];

export async function seedDatabaseIfEmpty(db: Firestore) {
  try {
    const q = query(collection(db, "properties"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.log("Firestore database is empty. Seeding master tenancy sample records...");

      // 1. Seed Properties
      for (const p of sampleProperties) {
        await setDoc(doc(db, "properties", p.id), p);
      }

      // 2. Seed Leases
      for (const l of sampleLeases) {
        await setDoc(doc(db, "leases", l.id), l);
      }

      // 3. Seed Payments
      for (const pay of samplePayments) {
        await setDoc(doc(db, "payments", pay.id), pay);
      }

      // 4. Seed Compliance
      for (const c of sampleCompliance) {
        await setDoc(doc(db, "compliance", c.id), c);
      }

      console.log("Seeding completed successfully!");
    } else {
      console.log("Database already has records. Skipping seeding.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
