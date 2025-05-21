
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Content, UserInteraction, db } from '@/lib/db';
import { Heart, Bookmark, ArrowBigDown } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface ContentCardProps {
  content: Content;
  onPlay?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ content, onPlay }) => {
  const { address } = useWallet();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);

  useEffect(() => {
    const checkInteractions = async () => {
      if (address) {
        const liked = await db.hasInteraction(content.id, 'like');
        const watchLater = await db.hasInteraction(content.id, 'watchLater');
        setIsLiked(liked);
        setIsWatchLater(watchLater);
      }
    };
    
    checkInteractions();
  }, [content.id, address]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!address) return;
    
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

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!address) return;
    
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

  // Format the date
  const formattedDate = new Date(content.publishedAt).toLocaleDateString();
  
  // Truncate title and description for display
  const truncatedDescription = content.description.length > 100 
    ? `${content.description.substring(0, 97)}...` 
    : content.description;

  // Now using content.id (which is the CID) for the link
  return (
    <Link to={`/content/${content.id}`} className="block border border-black hover:bg-gray-50">
      <div className="aspect-video bg-gray-100 relative">
        {content.thumbnail ? (
          <img 
            src={content.thumbnail} 
            alt={content.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-white">
            {content.type === 'audio' ? 'AUDIO' : 'VIDEO'}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 uppercase">{content.type}</div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold">{content.title}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handleLike}
              className={`p-1 ${isLiked ? 'text-black' : 'text-gray-500'}`}
              disabled={!address}
            >
              <Heart size={18} fill={isLiked ? "black" : "none"} />
            </button>
            <button 
              onClick={handleWatchLater}
              className={`p-1 ${isWatchLater ? 'text-black' : 'text-gray-500'}`}
              disabled={!address}
            >
              <Bookmark size={18} fill={isWatchLater ? "black" : "none"} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">{truncatedDescription}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>By: {content.publisher.slice(0, 6)}...{content.publisher.slice(-4)}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
