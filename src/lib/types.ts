
export interface PodexManifest {
    title: string;
    description: string;
    type: 'audio' | 'video';
    publisher: string;
    publishedAt: number;
    thumbnailCid: string;
    contentCid: string;
    signature: string;
  }

// Define content announcement interface
export type ContentAnnouncement = PodexManifest & {
    cid: string;
  }

// Add a new interface for verification status
export interface VerificationStatus {
  contentId: string;
  isVerified: boolean;
  verifiedAt: number;
}
