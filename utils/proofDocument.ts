import { api } from '../services/api';
import { getMediaUrl } from '../services/http';

export const isPdfProof = (proofOrUrl: string | null | undefined): boolean => {
  if (!proofOrUrl) return false;
  const value = proofOrUrl.toLowerCase();
  return value.endsWith('.pdf') || value.includes('application/pdf');
};

export const getProofFilename = (proof: string): string => {
  const normalized = proof.split('?')[0];
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'proof-document';
};

export const resolveProofDocumentUrl = async (proof: string): Promise<string> => {
  if (!proof) {
    throw new Error('Proof document is missing');
  }

  if (proof.startsWith('http://') || proof.startsWith('https://')) {
    return proof;
  }

  if (proof.startsWith('/api/')) {
    return getMediaUrl(proof);
  }

  const response = await api.getFileUrl(proof);
  return response.data.url;
};
