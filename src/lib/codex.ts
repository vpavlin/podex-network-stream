
import { useSettings } from '@/contexts/SettingsContext';

interface UploadResult {
  cid: string;
  url: string;
}

// Utility hook for Codex API functions
export const useCodexApi = () => {
  const { codexApiUrl } = useSettings();

  // Upload content to Codex
  const uploadToCodex = async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${codexApiUrl}/data`, {
      method: 'POST',
      headers: {
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      cid: data.cid,
      url: `${codexApiUrl}/data/${data.cid}/network/stream`,
    };
  };

  // Check if content exists in the network
  const checkContentAvailability = async (cid: string): Promise<boolean> => {
    try {
      const response = await fetch(`${codexApiUrl}/data/${cid}/network/manifest`);
      return response.ok;
    } catch (error) {
      console.error('Error checking content availability:', error);
      return false;
    }
  };

  // Get content stream URL
  const getContentStreamUrl = (cid: string): string => {
    return `${codexApiUrl}/data/${cid}/network/stream`;
  };

  // Download content (for liked/watch later)
  const downloadContent = async (cid: string): Promise<void> => {
    const response = await fetch(`${codexApiUrl}/data/${cid}/network`);
    if (!response.ok) {
      throw new Error('Failed to download content');
    }
  };

  return {
    uploadToCodex,
    checkContentAvailability,
    getContentStreamUrl,
    downloadContent,
  };
};
