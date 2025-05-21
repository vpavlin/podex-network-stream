import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Buffer } from "buffer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchStreaming(url: string, updateData: (data: string) => void) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Ensure headers match the server's expectations
      },
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

export async function verifySignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
  try {
    if (!window.ethereum || !signature || !expectedAddress) {
      return false;
    }
    
    // Create the message buffer that was signed
    const msgBuffer = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    
    // Recover the address from the signature
    const recoveredAddress = await window.ethereum.request({
      method: "personal_ecRecover",
      params: [msgBuffer, signature],
    });
    
    // Compare the recovered address to the expected address (case-insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// New utility function to resolve ENS names
export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    if (!window.ethereum || !address) {
      return null;
    }
    
    // Use the eth_call method to call the ENS reverse resolver
    const ensName = await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: "0x084b1c3c81545d370f3634392de611caabff8148", // ENS Reverse Resolver
          data: `0x691f3431${address.slice(2).padStart(64, '0')}` // encoding for 'name(address)'
        },
        "latest"
      ]
    });
    
    if (ensName && ensName !== '0x' && ensName.length > 2) {
      // Decode the result (string)
      const offset = parseInt(ensName.slice(2 + 64, 2 + 128), 16);
      const length = parseInt(ensName.slice(2 + offset * 2, 2 + offset * 2 + 64), 16);
      const nameHex = ensName.slice(2 + offset * 2 + 64, 2 + offset * 2 + 64 + length * 2);
      
      // Convert hex to string
      let name = '';
      for (let i = 0; i < nameHex.length; i += 2) {
        name += String.fromCharCode(parseInt(nameHex.slice(i, i + 2), 16));
      }
      
      return name || null;
    }
    return null;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
}

// Helper function for displaying address (ENS or formatted address)
export async function formatAddress(address: string, short: boolean = true): Promise<string> {
  if (!address) return '';
  
  // Try to resolve ENS name first
  const ensName = await resolveEnsName(address);
  if (ensName) return ensName;
  
  // Otherwise, format the address
  return short 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
}
