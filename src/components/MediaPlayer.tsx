
import { useRef, useEffect, useState } from 'react';
import { Content } from '@/lib/db';
import { useCodexApi } from '@/lib/codex';
import { toast } from '@/hooks/use-toast';

interface MediaPlayerProps {
  content: Content;
  autoPlay?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ content, autoPlay = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [contentAvailable, setContentAvailable] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const { checkContentAvailability, getContentStreamUrl } = useCodexApi();
  
  // Verify content availability when component mounts or content changes
  useEffect(() => {
    const verifyContent = async () => {
      setIsLoading(true);
      if (content.cid) {
        try {
          const isAvailable = await checkContentAvailability(content.cid);
          setContentAvailable(isAvailable);
          if (!isAvailable) {
            console.warn('Content not available in the network:', content.cid);
            toast({
              title: "Content Unavailable",
              description: "This content is currently not available on the network."
            });
          }
        } catch (error) {
          console.error('Error verifying content:', error);
          // Continue anyway, we'll try to play from URL if CID fails
        }
      }
      setIsLoading(false);
    };
    
    verifyContent();
  }, [content.cid, content.id]); // Only re-run when content.id or content.cid changes
  
  // Set the stream URL once when content or availability changes
  useEffect(() => {
    // Get the stream URL, with fallback to content.url if needed
    const url = content.cid 
      ? (contentAvailable ? getContentStreamUrl(content.cid) : content.url) 
      : content.url;
    
    setStreamUrl(url || '');
  }, [content.cid, content.url, contentAvailable]);

  // Handle media errors with fallback
  useEffect(() => {
    if (mediaRef.current) {
      const media = mediaRef.current;
      
      const handleError = (e: Event) => {
        console.error('Media playback error:', e);
        
        if (content.cid && content.url && media.src !== content.url) {
          toast({
            title: "Playback Error",
            description: "Trying fallback source..."
          });
          media.src = content.url;
          media.load();
        }
      };
      
      media.addEventListener('error', handleError);
      
      return () => {
        media.removeEventListener('error', handleError);
      };
    }
  }, [mediaRef.current, content.url, content.cid]);

  return (
    <div className="w-full border border-black bg-white">
      {isLoading ? (
        <div className="w-full aspect-video bg-black flex items-center justify-center text-white">
          <p>Loading content...</p>
        </div>
      ) : !contentAvailable && !content.url ? (
        <div className="w-full aspect-video bg-black flex items-center justify-center text-white">
          <p>Content currently unavailable</p>
        </div>
      ) : (
        <div className="w-full aspect-video bg-black">
          {content.type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={streamUrl || ''}
              className="w-full h-full"
              controls={true}
              autoPlay={autoPlay}
              poster={content.thumbnail}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={streamUrl || ''}
                controls={true}
                autoPlay={autoPlay}
                className="w-full max-w-md"
              />
              <div className="text-white text-4xl">AUDIO</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;
