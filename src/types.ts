export type LeaseStatus = 'draft' | 'awaiting_approval' | 'active' | 'expired' | 'terminated';
export type UnitStatus = 'empty' | 'leased' | 'maintenance';
export type PaymentStatus = 'paid' | 'partial' | 'late' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check';
export type ApprovalStage = 'legal' | 'finance' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'expiry' | 'payment' | 'approval' | 'system';

export interface Building {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  totalUnits: number;
  image?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  buildingName: string;
  floorNumber: string;
  totalUnits: number;
  createdBy: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorNumber: string;
  unitNumber: string;
  areaSqm: number;
  rentPerSqm: number;
  status: UnitStatus;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  sector: string;
  createdBy: string;
  createdAt: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  tenantName: string;
  buildingId: string;
  buildingName: string;
  unitId: string;
  unitNumber: string;
  floorNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  billingDay: number;
  status: LeaseStatus;
  approvalStage: ApprovalStage;
  googleDriveUrl?: string;
  agentName?: string;
  createdAt: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  buildingId: string;
  buildingName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  googleDriveUrl: string;
  buildingId?: string;
  buildingName?: string;
  tenantId?: string;
  tenantName?: string;
  leaseId?: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  module: string;
  timestamp: string;
  details: string;
}

export interface ApprovalWorkflow {
  id: string;
  leaseId: string;
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  requestedBy: string;
  requestedAt: string;
  stage: 'legal' | 'finance';
  status: ApprovalStatus;
  comments?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: NotificationType;
}

export interface PortfolioStats {
  totalBuildings: number;
  totalFloors: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number; // percentage
  totalTenants: number;
  totalLeases: number;
  activeLeases: number;
  monthlyRevenueEstimate: number;
  revenueCollected: number;
  revenueOutstanding: number;
}
