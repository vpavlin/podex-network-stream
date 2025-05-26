import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { Codex } from "@codex-storage/sdk-js";
import { BrowserUploadStategy } from "@codex-storage/sdk-js/browser";
import { PodexManifest } from './types';
import { Content } from './db';



interface UploadResult {
  cid: string;
  url: string;
}

// Keep track of pending requests to implement rate limiting
const pendingRequests = new Map<string, Promise<any>>();
const RETRY_DELAY = 2000; // Base delay between retries in ms
const MAX_RETRIES = 3;

// Function to sanitize filenames for HTTP headers
const sanitizeFilename = (filename: string): string => {
  // Replace non-ASCII characters and keep only safe characters
  return filename
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/[^a-zA-Z0-9_.-]/g, '_'); // Replace other unsafe chars with underscore
};

// Utility hook for Codex API functions
export const useCodexApi = () => {
  const { codexApiUrl } = useSettings();
  const  codex = new Codex(codexApiUrl)

  // Upload content to Codex
  const uploadToCodex = async (file: File): Promise<UploadResult> => {
    try {
      // Create a sanitized filename for the Content-Disposition header
      const sanitizedFilename = sanitizeFilename(file.name);

      let ftype = file.type
      if (file.type == "audio/m4a" || file.type == "audio/x-m4a") {
        ftype = "audio/mp4"
      }

      const metadata = { filename: sanitizedFilename, mimetype: ftype };

      const stategy = new BrowserUploadStategy(file, undefined, metadata);

      const data = codex.data;
      const uploadResponse = data.upload(stategy);

      const res = await uploadResponse.result;

      if (res.error) {
        throw new Error(`${res.error}`);
      }

      // The API returns plaintext CID, not JSON
      const cid = res.data as string;
      
      return {
        cid,
        url: `${codexApiUrl}/data/${cid}/network/stream`,
      };
    } catch (e) {
        throw new Error(`Failed to upload ${file.name}: ${e}`)
    }
  };

  const fetchPodexManifest = async (cid: string): Promise<Content> => {
    const data = codex.data
    const res = await data.networkDownloadStream(cid)

    if (res.error) {
      throw new Error(`Failed to fetch Podex manifest: ${res.data}`)
    }

    const result = res.data as Response
    const manifest:PodexManifest = await result.json()

    return {...manifest, id: cid, cid: manifest.contentCid,  url: getContentStreamUrl(manifest.contentCid)}
  }

  // Check if content exists in the network with rate limiting and retries
  const checkContentAvailability = async (cid: string): Promise<boolean> => {
    // If we already have a pending request for this CID, return that promise
    if (pendingRequests.has(cid)) {
      return pendingRequests.get(cid) as Promise<boolean>;
    }
    
    const checkRequest = async (): Promise<boolean> => {
      let retries = 0;
      
      while (retries <= MAX_RETRIES) {
        try {
          // Add increasing delay between retries (exponential backoff)
          if (retries > 0) {
            await new Promise(resolve => 
              setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1))
            );
          }
          
          const data = codex.data
          const res = await data.fetchManifest(cid)
          if (res.error) {
            throw new Error(`Failed to fetch manifest: ${res.data}`)
          }

          return true
        } catch (error) {
          console.error('Error checking content availability:', error);
          
          // If we've reached max retries, give up
          if (retries === MAX_RETRIES) {
            console.warn(`Content not available after ${MAX_RETRIES} retries:`, cid);
            return false;
          }
          
          retries++;
        }
      }
      
      return false;
    };
    
    // Store the promise in our map
    const requestPromise = checkRequest().finally(() => {
      // Clean up the map once we're done
      pendingRequests.delete(cid);
    });
    
    pendingRequests.set(cid, requestPromise);
    return requestPromise;
  };

  // Get content stream URL
  const getContentStreamUrl = (cid: string): string => {
    return `${codexApiUrl}/api/codex/v1/data/${cid}/network/stream`;
  };

  // Download content (for liked/watch later) with retry mechanism
  const downloadContent = async (cid: string): Promise<void> => {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
        // Add exponential backoff delay between retries
        if (retries > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1))
          );
        }
        
        const data = codex.data
        const res = await data.networkDownload(cid)
        if (res.error) {
          throw new Error(`Failed to fetch manifest: ${res.data}`)
        }
        
        
        toast({
          title: "Content Download Started",
          description: "The content is being downloaded to the node."
        });
        return;
        
      } catch (error) {
        console.error('Error downloading content:', error);
        
        // If we've reached max retries, give up
        if (retries === MAX_RETRIES) {
          toast({
            title: "Download Failed",
            description: "Could not download the content after multiple attempts."
          });
          throw new Error('Failed to download content after multiple attempts');
        }
        
        retries++;
      }
    }
  };

  return {
    uploadToCodex,
    checkContentAvailability,
    getContentStreamUrl,
    downloadContent,
    fetchPodexManifest,
  };
};
