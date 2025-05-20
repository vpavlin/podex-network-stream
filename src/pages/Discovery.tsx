
import { useState, useEffect } from 'react';
import { Content, db } from '@/lib/db';
import ContentCard from '@/components/ContentCard';
import { useWallet } from '@/contexts/WalletContext';

const Discovery = () => {
  const [latestContent, setLatestContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useWallet();

  useEffect(() => {
    const loadLatestContent = async () => {
      try {
        setIsLoading(true);
        const content = await db.getLatestContent(20);
        setLatestContent(content);
      } catch (error) {
        console.error('Error loading latest content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestContent();
    
    // Set up a polling mechanism to check for new content
    const intervalId = setInterval(loadLatestContent, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

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
      };
      
      await db.addContent(demoContent);
      setLatestContent(prevContent => [demoContent, ...prevContent]);
    } catch (error) {
      console.error('Error adding demo content:', error);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">DISCOVER NEW CONTENT</h1>
        
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={addDemoContent}
            className="border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
          >
            Add Demo Content
          </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="w-full flex justify-center items-center py-12">
          <p>Loading...</p>
        </div>
      ) : latestContent.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-12 border border-black">
          <p className="mb-4">No content discovered yet.</p>
          <p className="text-sm text-gray-600">Content will appear here as it becomes available on the network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {latestContent.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Discovery;
