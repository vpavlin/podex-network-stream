
import { useState, useEffect } from 'react';
import { Content, db, UserContent } from '@/lib/db';
import ContentCard from '@/components/ContentCard';
import { useWallet } from '@/contexts/WalletContext';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Consumer = () => {
  const { address } = useWallet();
  const [uploadedContent, setUploadedContent] = useState<Content[]>([]);
  const [likedContent, setLikedContent] = useState<Content[]>([]);
  const [watchLaterContent, setWatchLaterContent] = useState<Content[]>([]);
  const [viewedContent, setViewedContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserContent = async () => {
      if (!address) {
        setUploadedContent([]);
        setLikedContent([]);
        setWatchLaterContent([]);
        setViewedContent([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Load all content first
        const allContent = await db.getAllContent();
        
        // Filter for content published by the current address
        const userUploaded = allContent.filter(content => content.publisher === address);
        
        // Get liked, watch later and viewed content
        const liked = await db.getLikedContent();
        const watchLater = await db.getWatchLaterContent();
        const viewed = await db.getViewedContent();
        
        setUploadedContent(userUploaded);
        setLikedContent(liked);
        setWatchLaterContent(watchLater);
        setViewedContent(viewed);
      } catch (error) {
        console.error('Error loading user content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserContent();
  }, [address]);

  if (!address) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center border border-black p-12">
          <h2 className="text-xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="mb-4">Please connect your Ethereum wallet to view your content.</p>
          <p className="text-sm text-gray-600 mb-6">Your content and preferences are tied to your wallet address.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center py-12">
          <p>Loading your content...</p>
        </div>
      </div>
    );
  }

  const noContentMessage = (
    <div className="w-full flex flex-col items-center justify-center py-12 border border-black">
      <p className="mb-4">No content found</p>
      <p className="text-sm text-gray-600 mb-6">Content you interact with will appear here.</p>
    </div>
  );

  return (
    <div className="container py-6">
      <h1 className="text-xl font-bold mb-6">MY CONTENT</h1>
      
      <Tabs defaultValue="uploaded" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 border border-black">
          <TabsTrigger value="uploaded" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Uploaded
          </TabsTrigger>
          <TabsTrigger value="liked" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Liked
          </TabsTrigger>
          <TabsTrigger value="watchLater" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Watch Later
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-black data-[state=active]:text-white">
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="uploaded">
          {uploadedContent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uploadedContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-black">
              <p className="mb-4">You haven't uploaded any content yet.</p>
              <Link 
                to="/publish" 
                className="border border-black px-4 py-2 hover:bg-black hover:text-white"
              >
                Upload Content
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked">
          {likedContent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {likedContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : noContentMessage}
        </TabsContent>
        
        <TabsContent value="watchLater">
          {watchLaterContent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {watchLaterContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : noContentMessage}
        </TabsContent>
        
        <TabsContent value="history">
          {viewedContent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {viewedContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : noContentMessage}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Consumer;
