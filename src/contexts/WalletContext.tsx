
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Buffer } from 'buffer';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: (msg:string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for saved wallet address on startup
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet-address');
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Check if ethereum object exists (MetaMask is installed)
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          handleAccountsChanged(accounts);
          
          // Set up event listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('disconnect', disconnect);
          
        } catch (error) {
          console.error('Error connecting to wallet:', error);
          toast({ 
            title: "Wallet Connection Failed",
            description: "Error connecting to your wallet. Please try again."
          });
        }
      } else {
        toast({
          title: "Ethereum Wallet Not Found",
          description: "Please install MetaMask or another Ethereum wallet to use this feature."
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else {
      // User switched accounts
      const newAddress = accounts[0];
      setAddress(newAddress);
      localStorage.setItem('wallet-address', newAddress);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`
      });
    }
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem('wallet-address');
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('disconnect', disconnect);
    }
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected."
    });
  };

  const sign = async (msg:string):Promise<string> => {
    if (!window.ethereum) {
      toast({
        title: "Ethereum Wallet not connected",
        description: "Please install MetaMask or another Ethereum wallet and conect the wallet."
      });
      throw new Error("Wallet not connected")
    }
    const toSign = `0x${Buffer.from(msg, "utf8").toString("hex")}`
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [toSign, address],
    })

    return signature
  }

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect, sign }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
