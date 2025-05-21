import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
