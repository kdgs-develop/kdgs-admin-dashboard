export interface ObituaryResult {
  id: number;
  reference: string;
  surname?: string | null;
  givenNames?: string | null;
  maidenName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  notes?: string | null;
  proofread: boolean;
  publicHash?: string | null;
  title?: {
    name?: string | null;
  } | null;
  imageNames?: string[];
  fileImages?: {
    id: string;
    name: string;
  }[];
}

export interface PaymentSession {
  id: string;
  url: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  error?: string;
  obituaryId?: number;
  obituaryReference?: string;
  customerEmail?: string;
}
