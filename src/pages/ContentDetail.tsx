
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Content, db, UserInteraction } from '@/lib/db';
import MediaPlayer from '@/components/MediaPlayer';
import { useWallet } from '@/contexts/WalletContext';
import { Heart, Bookmark } from 'lucide-react';
import { useCodexApi } from '@/lib/codex';

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>(); // This is now the CID
  const { address } = useWallet();
  const { fetchPodexManifest } = useCodexApi();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        // Try to get content by CID (which is now the id)
        let contentData = await db.getContent(id);
        if (!contentData) {
          contentData = await fetchPodexManifest(id)
        }
        
        if (contentData) {
          setContent(contentData);
          
          // Record view interaction
          if (address) {
            const viewInteraction: UserInteraction = {
              contentId: id,
              action: 'viewed',
              timestamp: Date.now()
            };
            await db.addInteraction(viewInteraction);
          }
          
          // Check if liked or saved to watch later
          if (address) {
            const liked = await db.hasInteraction(id, 'like');
            const watchLater = await db.hasInteraction(id, 'watchLater');
            setIsLiked(liked);
            setIsWatchLater(watchLater);
          }
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [id, address]);

  const handleLike = async () => {
    if (!address || !content) return;
    
    if (isLiked) {
      await db.removeInteraction(content.id, 'like');
      setIsLiked(false);
    } else {
      const interaction: UserInteraction = {
        contentId: content.id,
        action: 'like',
        timestamp: Date.now()
      };
      await db.addInteraction(interaction);
      setIsLiked(true);
    }
  };

  const handleWatchLater = async () => {
    if (!address || !content) return;
    
    if (isWatchLater) {
      await db.removeInteraction(content.id, 'watchLater');
      setIsWatchLater(false);
    } else {
      const interaction: UserInteraction = {
        contentId: content.id,
        action: 'watchLater',
        timestamp: Date.now()
      };
      await db.addInteraction(interaction);
      setIsWatchLater(true);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center py-12">
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center border border-black p-12">
          <h2 className="text-xl font-bold mb-4">Content Not Found</h2>
          <p className="mb-4">The content you are looking for could not be found.</p>
          <p className="text-sm text-gray-600">It may have been removed or is not available on this node.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        <MediaPlayer content={content} autoPlay={true} />
        
        <div className="mt-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{content.title}</h1>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-1 ${isLiked ? 'text-black' : 'text-gray-600'}`}
                disabled={!address}
              >
                <Heart size={20} fill={isLiked ? "black" : "none"} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>
              
              <button 
                onClick={handleWatchLater}
                className={`flex items-center space-x-1 ${isWatchLater ? 'text-black' : 'text-gray-600'}`}
                disabled={!address}
              >
                <Bookmark size={20} fill={isWatchLater ? "black" : "none"} />
                <span>{isWatchLater ? 'Saved' : 'Save for later'}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span>Published by {content.publisher.slice(0, 6)}...{content.publisher.slice(-4)}</span>
            <span className="mx-2">•</span>
            <span>{new Date(content.publishedAt).toLocaleDateString()}</span>
          </div>
          
          <hr className="my-4 border-black" />
          
          <div className="mt-4 whitespace-pre-wrap">
            {content.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
