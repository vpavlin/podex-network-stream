
import React, { useState, useEffect } from 'react';
import { db, FollowedAddress } from '@/lib/db';
import { resolveEnsName, formatAddress } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRoundPlus, X, UserCheck } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

const FollowingList: React.FC = () => {
  const [followedAddresses, setFollowedAddresses] = useState<FollowedAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address: connectedAddress } = useWallet();

  // Load followed addresses
  useEffect(() => {
    const loadFollowedAddresses = async () => {
      try {
        setIsLoading(true);
        const addresses = await db.getFollowedAddresses();
        setFollowedAddresses(addresses);
      } catch (error) {
        console.error('Error loading followed addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowedAddresses();
  }, []);

  // Follow a new address
  const handleFollow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddress.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Clean up the address (may be ENS or hex)
      let addressToFollow = newAddress.trim();
      
      // Check if it's an ENS name
      if (addressToFollow.endsWith('.eth') || !addressToFollow.startsWith('0x')) {
        // Try to resolve ENS name
        try {
          const resolvedAddress = await window.ethereum.request({
            method: 'eth_resolveName',
            params: [addressToFollow]
          });
          
          if (!resolvedAddress) {
            toast({
              title: "Invalid ENS name",
              description: "Could not resolve the ENS name to an address.",
              variant: "destructive"
            });
            return;
          }
          
          // Use the resolved address
          await db.followAddress(resolvedAddress, addressToFollow);
          toast({
            title: "Address followed",
            description: `You are now following ${addressToFollow}`
          });
        } catch (error) {
          console.error('Error resolving ENS name:', error);
          toast({
            title: "Error",
            description: "Could not resolve the ENS name. Please check and try again.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // It's a regular address
        if (!addressToFollow.match(/^0x[a-fA-F0-9]{40}$/)) {
          toast({
            title: "Invalid address",
            description: "Please enter a valid Ethereum address",
            variant: "destructive"
          });
          return;
        }
        
        // Try to get ENS name for the address
        const ensName = await resolveEnsName(addressToFollow);
        
        await db.followAddress(addressToFollow, ensName || undefined);
        toast({
          title: "Address followed",
          description: `You are now following ${ensName || addressToFollow}`
        });
      }
      
      // Refresh the list
      const addresses = await db.getFollowedAddresses();
      setFollowedAddresses(addresses);
      setNewAddress('');
      
    } catch (error) {
      console.error('Error following address:', error);
      toast({
        title: "Error",
        description: "Failed to follow address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unfollow an address
  const handleUnfollow = async (address: string) => {
    try {
      await db.unfollowAddress(address);
      
      // Update state to remove the unfollowed address
      setFollowedAddresses(prevAddresses => 
        prevAddresses.filter(a => a.address.toLowerCase() !== address.toLowerCase())
      );
      
      toast({
        title: "Address unfollowed",
        description: "You have unfollowed this address"
      });
    } catch (error) {
      console.error('Error unfollowing address:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow address",
        variant: "destructive"
      });
    }
  };

  // Follow yourself if connected with wallet
  const handleFollowSelf = async () => {
    if (!connectedAddress) {
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Check if already following
      const isFollowed = await db.isAddressFollowed(connectedAddress);
      if (isFollowed) {
        toast({
          title: "Already following",
          description: "You are already following your own address"
        });
        return;
      }
      
      // Try to get ENS name
      const ensName = await resolveEnsName(connectedAddress);
      
      await db.followAddress(connectedAddress, ensName || undefined);
      
      // Refresh the list
      const addresses = await db.getFollowedAddresses();
      setFollowedAddresses(addresses);
      
      toast({
        title: "Now following yourself",
        description: "You will see your own publications in your feed"
      });
    } catch (error) {
      console.error('Error following self:', error);
      toast({
        title: "Error",
        description: "Failed to follow your address",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-black p-6">
      <h2 className="text-lg font-medium mb-4">Followed Addresses</h2>
      
      {/* Follow form */}
      <form onSubmit={handleFollow} className="mb-6">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter wallet address or ENS name"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border border-black"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !newAddress.trim()}
              className="border border-black bg-white text-black hover:bg-black hover:text-white px-4 py-2"
            >
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Follow
            </Button>
            
            {connectedAddress && (
              <Button 
                type="button" 
                onClick={handleFollowSelf}
                disabled={isSubmitting}
                className="border border-black bg-white text-black hover:bg-black hover:text-white px-4 py-2"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Follow Self
              </Button>
            )}
          </div>
        </div>
      </form>
      
      {/* List of followed addresses */}
      <div className="space-y-2">
        <h3 className="font-medium mb-2">Currently Following</h3>
        
        {isLoading ? (
          <div>Loading...</div>
        ) : followedAddresses.length === 0 ? (
          <div className="text-gray-500">You are not following any addresses yet.</div>
        ) : (
          <div className="space-y-2">
            {followedAddresses.map((followed) => (
              <div key={followed.address} className="flex justify-between items-center border border-gray-200 p-2">
                <div>
                  {followed.ensName ? (
                    <div>
                      <span className="font-medium">{followed.ensName}</span>
                      <span className="text-gray-500 text-sm ml-2">({followed.address.slice(0, 6)}...{followed.address.slice(-4)})</span>
                    </div>
                  ) : (
                    <div>{followed.address.slice(0, 6)}...{followed.address.slice(-4)}</div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleUnfollow(followed.address)}
                  className="text-gray-500 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingList;
