import { useWallet } from "@/contexts/WalletContext";
import { Link } from "react-router-dom";
import { Settings, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { formatAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import PodexLogo from "./PodexLogo";

const Header = () => {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [addressDisplay, setAddressDisplay] = useState<string>('');

  useEffect(() => {
    const resolveAddress = async () => {
      if (address) {
        const displayName = await formatAddress(address);
        setAddressDisplay(displayName);
      }
    };

    resolveAddress();
  }, [address]);

  const handleFollowAddress = async () => {
    if (!address) return;
    
    try {
      // Check if already following
      const isFollowed = await db.isAddressFollowed(address);
      
      if (isFollowed) {
        toast({
          title: "Already following",
          description: "You are already following your own address",
        });
        return;
      }
      
      // Try to get ENS name using ethers
      let ensName = null;
      try {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          ensName = await provider.lookupAddress(address);
        }
      } catch (err) {
        console.error("Error getting ENS name:", err);
      }
      
      await db.followAddress(address, ensName || undefined);
      
      toast({
        title: "Address followed",
        description: `You are now following ${ensName || addressDisplay}`
      });
    } catch (error) {
      console.error('Error following address:', error);
      toast({
        title: "Error",
        description: "Failed to follow address",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="w-full border-b border-black py-4">
      <div className="container flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="mr-8">
            <PodexLogo />
          </Link>
          <nav className="space-x-6">
            <Link to="/" className="hover:underline">Discover</Link>
            <Link to="/consumer" className="hover:underline">My Content</Link>
            <Link to="/publish" className="hover:underline">Publish</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Link 
            to="/settings" 
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Settings"
          >
            <Settings size={20} />
          </Link>
          
          {address ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">{addressDisplay}</span>
              <Button
                onClick={handleFollowAddress}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 h-auto"
                title="Follow your own address"
              >
                <UserPlus className="h-3 w-3" />
                <span className="text-xs">Follow</span>
              </Button>
              <button 
                onClick={disconnect}
                className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={connect}
              disabled={isConnecting}
              className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
