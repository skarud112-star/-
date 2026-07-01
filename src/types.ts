export interface CruiseProduct {
  id: string;
  name: string;
  description: string;
  duration: string;
  season: string;
  imageUrl?: string;
  tagline: string;
}

export interface SubmitMeta {
  ipAddress: string;
  deviceType: string;
  os: string;
  browser: string;
  userAgent: string;
  pageUrl: string;
  submittedAt: string;
}

export interface ConsultationRequest {
  id: string;
  name: string;
  contact: string;
  location: string;
  desiredPeriod: string;
  travelerCount: number;
  selectedProduct: string;
  availableTime: string;
  message: string;
  submittedAt: string;
  status: 'pending' | 'inprogress' | 'completed' | 'canceled';
  submitMeta?: SubmitMeta;
  adminMemo?: string;
}
