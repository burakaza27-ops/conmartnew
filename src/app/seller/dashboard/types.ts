// =============================================================================
// ConMart — Seller Dashboard Types
// =============================================================================

export interface PriceTierItem {
  id: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
  validUntil: string;
  isExpired: boolean;
}

export interface SellerListingItem {
  id: string;
  active: boolean;
  location: string;
  imageUrl: string | null;
  productTitle: string;
  productUnit: string;
  categoryName: string;
  orderCount: number;
  enquiryCount: number;
  priceTiers: PriceTierItem[];
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  earnedMonths: number;
  currentMilestone: number;
  nextMilestone: { count: number; months: number } | null;
  milestones: { count: number; months: number }[];
  referrals: {
    id: string;
    qualified: boolean;
    qualifiedAt: string | null;
    createdAt: string;
    referredName: string;
    referredCompany: string;
  }[];
}

export interface SellerSubscriptionInfo {
  storedStatus: string;
  effectiveStatus: string;
  expiresAt: string | null;
  directChatEnabled: boolean;
}
