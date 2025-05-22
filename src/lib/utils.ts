import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Buffer } from "buffer";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple cache for ENS names with TTL and localStorage persistence
interface EnsCacheEntry {
  name: string | null;
  expiresAt: number;
}

const ENS_CACHE_KEY = 'podex_ens_cache';
const ENS_CACHE_TTL = 3600000; // 1 hour in milliseconds

// Load initial cache from localStorage
const loadEnsCache = (): Record<string, EnsCacheEntry> => {
  try {
    const storedCache = localStorage.getItem(ENS_CACHE_KEY);
    return storedCache ? JSON.parse(storedCache) : {};
  } catch (error) {
    console.error("Failed to load ENS cache from localStorage:", error);
    return {};
  }
};

const ensCache: Record<string, EnsCacheEntry> = loadEnsCache();

// Save cache to localStorage
const saveEnsCache = (): void => {
  try {
    localStorage.setItem(ENS_CACHE_KEY, JSON.stringify(ensCache));
  } catch (error) {
    console.error("Failed to save ENS cache to localStorage:", error);
  }
};

export async function fetchStreaming(url: string, updateData: (data: string) => void) {
  try {
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add basic auth header if stored in localStorage
    const apiUrl = localStorage.getItem('codexApiUrl');
    const downloadUrl = localStorage.getItem('downloadApiUrl');
    
    if (apiUrl && url.startsWith(apiUrl)) {
      const username = localStorage.getItem('codexApiUsername');
      const password = localStorage.getItem('codexApiPassword');
      
      if (username && password) {
        const base64Credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${base64Credentials}`;
      }
    } else if (downloadUrl && url.startsWith(downloadUrl)) {
      const username = localStorage.getItem('downloadApiUsername');
      const password = localStorage.getItem('downloadApiPassword');
      
      if (username && password) {
        const base64Credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${base64Credentials}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) throw new Error('Stream failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split buffer by newline (adjust delimiter if needed)
      const lines = buffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const message = lines[i].trim();
        if (message) {
          try {
            updateData(message); // Update UI with each message
          } catch (err) {
            console.error('Failed to parse message:', message);
          }
        }
      }

      buffer = lines[lines.length - 1]; // Retain incomplete line
    }

    // Handle final message in buffer (if any)
    updateData(buffer.trim());
    

  } catch (error) {
    console.error('Stream error:', error);
  }
}

// Updated to use ethers for signature verification
export async function verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
  try {
    if (!signature || !expectedAddress) {
      return false;
    }
    
    try {
      // Use ethers to recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare the recovered address to the expected address (case-insensitive)
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error("Ethers error verifying signature:", error);
      return false;
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// Get an ethers provider (used for ENS lookups and other operations)
export function getProvider() {
  // If window.ethereum is available, use it
 /* if (window.ethereum) {
    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error("Error creating provider from window.ethereum:", error);
    }
  }*/
  
  // Fallback to a public provider (like Infura)
  try {
    return new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/84842078b09946638c03157f83405213");
  } catch (error) {
    console.error("Error creating fallback provider:", error);
    return null;
  }
}

// Resolve ENS name using ethers with caching and localStorage persistence
export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    if (!address) return null;
    
    // Check if we have a valid cached result
    const now = Date.now();
    const cachedEntry = ensCache[address.toLowerCase()];
    
    if (cachedEntry && cachedEntry.expiresAt > now) {
      console.log(`Using cached ENS name for ${address}`);
      return cachedEntry.name;
    }
    
    // No valid cache entry, perform the lookup
    const provider = getProvider();
    if (!provider) return null;
    
    console.log(`Resolving ENS for address: ${address}`);
    const name = await provider.lookupAddress(address);
    
    // Cache the result (even if null) with expiry
    ensCache[address.toLowerCase()] = {
      name,
      expiresAt: now + ENS_CACHE_TTL
    };
    
    // Save updated cache to localStorage
    saveEnsCache();
    
    return name;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
}

// Helper function to clear the ENS cache
export function clearEnsCache(address?: string): void {
  if (address) {
    delete ensCache[address.toLowerCase()];
  } else {
    Object.keys(ensCache).forEach(key => delete ensCache[key]);
  }
  
  // Save updated cache to localStorage
  saveEnsCache();
}

// Helper function for displaying address (ENS or formatted address)
export async function formatAddress(address: string, short: boolean = true): Promise<string> {
  if (!address) return '';
  
  // Try to resolve ENS name first (this will use cache if available)
  const ensName = await resolveEnsName(address);
  if (ensName) return ensName;
  
  // Otherwise, format the address
  return short 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
}

// Create a helper function to add basic auth headers to URLs if needed
export function addBasicAuthHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  try {
    // Add basic auth header if stored in localStorage
    const apiUrl = localStorage.getItem('codexApiUrl');
    const downloadUrl = localStorage.getItem('downloadApiUrl');
    
    if (apiUrl && url.startsWith(apiUrl)) {
      const username = localStorage.getItem('codexApiUsername');
      const password = localStorage.getItem('codexApiPassword');
      
      if (username && password) {
        const base64Credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${base64Credentials}`;
      }
    } else if (downloadUrl && url.startsWith(downloadUrl)) {
      const username = localStorage.getItem('downloadApiUsername');
      const password = localStorage.getItem('downloadApiPassword');
      
      if (username && password) {
        const base64Credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${base64Credentials}`;
      }
    }
  } catch (error) {
    console.error("Error creating auth headers:", error);
  }
  
  return headers;
}
