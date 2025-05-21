
import { useWallet } from "@/contexts/WalletContext";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { formatAddress } from "@/lib/utils";

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

  return (
    <header className="w-full border-b border-black py-4">
      <div className="container flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tighter mr-8">
            <Link to="/">PODEX</Link>
          </h1>
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
