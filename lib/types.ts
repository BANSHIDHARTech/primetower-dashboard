export type UserRole = 'superadmin' | 'dealer' | 'salesrep';

export interface User {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  role: UserRole;
  dealerId: string | null;
  isActive: boolean;
  createdAt: string;
}

export type LeadStatus =
  | 'new_lead'
  | 'new'
  | 'site_visit_scheduled'
  | 'quoted'
  | 'sold'
  | 'survey_done'
  | 'installation_scheduled'
  | 'live'
  | 'rejected';

export interface Lead {
  id: string;
  salesRepId: string | null;
  dealerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  pincode: string | null;
  status: LeadStatus;
  systemCost: number | null; // This is the expected revenue
  netCost: number | null;    // This is the actual revenue
  quotationSentAt: string | null;
  soldAt: string | null;
  createdAt: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  site_visit_scheduled: 'Site Visit Scheduled',
  quoted: 'Quoted',
  sold: 'Sold',
  survey_done: 'Survey Done',
  installation_scheduled: 'Installation Scheduled',
  live: 'Live',
  rejected: 'Rejected',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  site_visit_scheduled: 'bg-purple-100 text-purple-800',
  quoted: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-green-100 text-green-800',
  survey_done: 'bg-teal-100 text-teal-800',
  installation_scheduled: 'bg-indigo-100 text-indigo-800',
  live: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};
