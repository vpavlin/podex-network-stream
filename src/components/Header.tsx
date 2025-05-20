
import { useWallet } from "@/contexts/WalletContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { address, isConnecting, connect, disconnect } = useWallet();

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

        <div>
          {address ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
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
