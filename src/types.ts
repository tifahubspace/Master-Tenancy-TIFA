export type LeaseStatus = 'active' | 'expired' | 'terminated';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review';
export type PaymentStatus = 'paid' | 'partial' | 'late' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check';
export type ComplianceCategory = 'noise' | 'maintenance' | 'pets' | 'unauthorized_guests' | 'late_payment' | 'other';
export type ComplianceSeverity = 'low' | 'medium' | 'high';
export type ComplianceCaseStatus = 'resolved' | 'warning_issued' | 'under_review' | 'escalated';

export interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  createdBy: string;
  createdAt: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  billingDay: number;
  status: LeaseStatus;
  complianceStatus: ComplianceStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface Compliance {
  id: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  status: ComplianceCaseStatus;
  details: string;
  reportedBy: string;
  dateReported: string;
  resolvedDate?: string;
  createdAt: string;
}

export interface PortfolioStats {
  totalLeases: number;
  activeLeases: number;
  totalRentReceivable: number;
  totalRentCollected: number;
  totalRentOutstanding: number;
  complianceRate: number; // percentage
  nonCompliantCount: number;
  totalComplianceCases: number;
  activeComplianceCases: number;
}
