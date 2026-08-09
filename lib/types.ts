export type UserRole = 'superadmin' | 'dealer' | 'salesrep' | 'team_leader';

export interface User {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  role: UserRole;
  dealerId: string | null;
  teamLeaderId?: string | null;
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

  // ── Key Metrics fields (optional — populated once backend exposes them) ──────
  source?: string | null;               // Lead source e.g. 'Meta', 'Organic', 'Referral'
  visitStatus?: string | null;          // 'Confirmed' | 'Assigned' | 'Completed' | 'Done'
  visitDate?: string | null;            // ISO date string of the scheduled/completed visit
  travelDistanceKm?: number | null;     // Distance gig worker travelled to complete visit
  checkinAt?: string | null;            // ISO timestamp when gig worker checked in at site
  checkoutAt?: string | null;           // ISO timestamp when gig worker checked out from site
  distanceTravelled?: number | null;    // Added from DB schema
  meetingDurationSecs?: number | null;  // Added from DB schema
  quotationDecision?: string | null;    // 'Accepted' | 'Denied' | 'Further Assistance'
  saleValue?: number | null;            // Explicit sale value (falls back to systemCost)
  
  // ── Payment & Discount fields (Added from API) ───────────────────
  hasReferral?: boolean | null;
  specialDiscountPercent?: number | null;
  downPayment?: number | null;
  paymentMode?: string | null;
  paymentType?: string | null;
  financePartner?: string | null;
  cashValue?: number | null;
}

/** Full customer detail — returned by GET /leads/:id enriched response */
export interface CustomerDetail extends Lead {
  // ── Flattened document URLs (enriched by API from documents[]) ──
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
  panImageUrl?: string | null;
  electricityBillUrl?: string | null;

  // ── KYC consent ─────────────────────────────────────────────────
  kycConsentAt?: string | null;
  kycConsentIp?: string | null;

  // ── Bill details ─────────────────────────────────────────────────
  isBillOnName?: boolean;
  billHolderName?: string | null;
  billHolderRelationship?: string | null;
  monthlyElectricityBill?: number | null;  // lead value OR OCR fallback
  monthlyFuelExpense?: number | null;
  sanctionedLoad?: number | null;

  // ── Solar system ─────────────────────────────────────────────────
  solarPanelBrand?: string | null;   // DB column: solar_panel_brand
  inverterBrand?: string | null;
  systemType?: string | null;
  isBatteryRequired?: boolean;
  structureHeight?: string | null;
  panelCount?: number | null;
  recommendedKw?: number | null;
  // Legacy aliases kept for backward compat with older data
  panelBrand?: string | null;
  systemSizeKw?: number | null;

  // ── Property & install ───────────────────────────────────────────
  installationFloor?: string | null;
  propertyType?: string | null;
  district?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roofLength?: number | string | null;
  roofBreadth?: number | string | null;

  // ── Gig Worker ───────────────────────────────────────────────────
  salesRep?: {
    id: string;
    fullName: string;
    phone?: string | null;
  } | null;

  // ── Nested raw data (available for document rendering) ───────────
  documents?: Array<{
    id: string;
    documentType: string;  // aadhaar_front | aadhaar_back | pan_card | electricity_bill | roof_photo | other
    storageUrl: string;
    createdAt: string;
  }> | null;
  quotations?: Array<{
    id: string;
    quotationNumber: string;
    pdfUrl?: string | null;
    systemSize?: number | string | null;
    systemCost?: number | string | null;
    subsidy?: number | string | null;
    netCost?: number | string | null;
    createdAt: string;
  }> | null;
  roofPhotos?: Array<{
    id: string;
    photoUrl: string;
    direction?: string | null;
  }> | null;
  billDetails?: {
    billPhotoUrl?: string | null;
    ocrBillingAmount?: number | null;
    ocrUnitsConsumed?: number | null;
    ocrConsumerNumber?: string | null;
  } | null;

  // ── Extra ────────────────────────────────────────────────────────
  salutation?: string | null;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new_lead: 'New Lead',
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
  new_lead: 'bg-sky-100 text-sky-800',
  new: 'bg-blue-100 text-blue-800',
  site_visit_scheduled: 'bg-purple-100 text-purple-800',
  quoted: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-green-100 text-green-800',
  survey_done: 'bg-teal-100 text-teal-800',
  installation_scheduled: 'bg-indigo-100 text-indigo-800',
  live: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

/** Ring colours for customer avatar borders on the card grid */
export const LEAD_STATUS_RING: Record<LeadStatus, string> = {
  new_lead: 'ring-sky-400',
  new: 'ring-blue-400',
  site_visit_scheduled: 'ring-purple-400',
  quoted: 'ring-yellow-400',
  sold: 'ring-green-500',
  survey_done: 'ring-teal-400',
  installation_scheduled: 'ring-indigo-400',
  live: 'ring-emerald-500',
  rejected: 'ring-red-400',
};
