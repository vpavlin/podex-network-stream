
import { useState, useEffect } from 'react';
import { Content, db } from '@/lib/db';
import ContentCard from '@/components/ContentCard';
import { useWallet } from '@/contexts/WalletContext';
import { getDispatcher, subscribeToContentAnnouncements } from '@/lib/waku';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { UserRoundPlus, UserCheck, Link } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Discovery = () => {
  const [latestContent, setLatestContent] = useState<Content[]>([]);
  const [followedContent, setFollowedContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'following'>('all');
  const { address } = useWallet();

  // Load content based on the current view mode
  useEffect(() => {
    let isMounted = true;
    
    const loadContent = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Add a small delay to ensure DB is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (viewMode === 'following') {
          const content = await db.getContentFromFollowedAddresses();
          if (!isMounted) return;
          setFollowedContent(content);
        } else {
          const disp = await getDispatcher()
          disp.clearDuplicateCache()
          disp.dispatchLocalQuery()

          const content = await db.getLatestContent(20);
          if (!isMounted) return;
          setLatestContent(content);

        }
      } catch (error) {
        console.error(`Error loading ${viewMode} content:`, error);
        if (!isMounted) return;
        setLoadError(`Failed to load ${viewMode} content. Please try again.`);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadContent();
    
    return () => {
      isMounted = false;
    };
  }, [viewMode]);

  // Set up real-time content updates
  useEffect(() => {
    // Update UI
    const processNewAnnounce = async (e: any) => {
      const newContent = e.detail;
      
      // Check if the publisher of this content is being followed
      if (newContent.publisher) {
        const isFollowed = await db.isAddressFollowed(newContent.publisher);
        
        if (isFollowed) {
          setFollowedContent(prev => [newContent, ...prev]);
        }
      }
      
      // Always update the latest content view
      setLatestContent(prev => [newContent, ...prev]);
    };

    document.addEventListener("podex:announce", processNewAnnounce);
    
    return () => {
      document.removeEventListener("podex:announce", processNewAnnounce);
    };
  }, []);

  // Handle address following
  const handleFollowPublisher = async (publisherAddress: string) => {
    if (!publisherAddress) return;
    
    try {
      // Check if already following
      const isFollowed = await db.isAddressFollowed(publisherAddress);
      
      if (isFollowed) {
        toast({
          title: "Already following",
          description: "You are already following this address",
        });
        return;
      }
      
      // Try to get ENS name for the address
      const ensName = await window.ethereum?.request({
        method: 'eth_lookupAddress',
        params: [publisherAddress]
      }).catch(() => null);
      
      await db.followAddress(publisherAddress, ensName || undefined);
      
      // Refresh followed content if in following mode
      if (viewMode === 'following') {
        const content = await db.getContentFromFollowedAddresses();
        setFollowedContent(content);
      }
      
      toast({
        title: "Address followed",
        description: `You are now following ${ensName || publisherAddress.slice(0,6)}...${publisherAddress.slice(-4)}`
      });
    } catch (error) {
      console.error('Error following publisher:', error);
      toast({
        title: "Error",
        description: "Failed to follow address",
        variant: "destructive"
      });
    }
  };

  // Simulate fetching content from decentralized network
  const addDemoContent = async () => {
    try {
      const demoContent: Content = {
        id: `content-${Date.now()}`,
        title: `Sample ${Math.random() < 0.5 ? 'Audio' : 'Video'} ${Date.now().toString().slice(-4)}`,
        description: 'This is a sample content item for demonstration purposes. In a real application, this would be fetched from a decentralized storage network.',
        type: Math.random() < 0.5 ? 'audio' : 'video',
        url: Math.random() < 0.5 
          ? 'https://download.samplelib.com/mp3/sample-15s.mp3' 
          : 'https://download.samplelib.com/mp4/sample-5s.mp4',
        publisher: address || '0xUnknownPublisher',
        publishedAt: Date.now(),
        signature: ""
      };
      
      await db.addContent(demoContent);
      setLatestContent(prevContent => [demoContent, ...prevContent]);
      
      // Also update followed content if relevant
      if (address) {
        const isAddressFollowed = await db.isAddressFollowed(address);
        if (isAddressFollowed) {
          setFollowedContent(prevContent => [demoContent, ...prevContent]);
        }
      }
    } catch (error) {
      console.error('Error adding demo content:', error);
    }
  };

  const displayContent = viewMode === 'following' ? followedContent : latestContent;

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl font-bold">DISCOVER NEW CONTENT</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setViewMode('all')}
            variant={viewMode === 'all' ? 'default' : 'outline'} 
            className={`border ${viewMode === 'all' ? 'bg-black text-white' : 'border-black'} px-3 py-1 text-sm`}
          >
            <Link className="h-4 w-4 mr-2" />
            All Content
          </Button>
          
          <Button
            onClick={() => setViewMode('following')}
            variant={viewMode === 'following' ? 'default' : 'outline'}
            className={`border ${viewMode === 'following' ? 'bg-black text-white' : 'border-black'} px-3 py-1 text-sm`}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Following
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Button 
              onClick={addDemoContent}
              className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
            >
              Add Demo Content
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="w-full flex flex-col items-center justify-center py-12 border border-black">
          <p className="text-red-500 mb-4">{loadError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
          >
            Retry
          </Button>
        </div>
      ) : displayContent.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-12 border border-black">
          {viewMode === 'following' ? (
            <>
              <p className="mb-4">No content from followed addresses.</p>
              <p className="text-sm text-gray-600 mb-4">Follow some addresses to see their content here.</p>
              <Button
                onClick={() => setViewMode('all')}
                className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
              >
                View All Content
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4">No content discovered yet.</p>
              <p className="text-sm text-gray-600">Content will appear here as it becomes available on the network.</p>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  onClick={addDemoContent}
                  className="mt-4 border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
                >
                  Add Demo Content
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayContent.map((content) => (
            <div key={content.id} className="relative">
              <ContentCard content={content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discovery;
