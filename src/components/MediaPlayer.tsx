
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Content } from '@/lib/db';
import { useCodexApi } from '@/lib/codex';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaPlayerProps {
  content: Content;
  autoPlay?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ content, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [contentAvailable, setContentAvailable] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
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

  // Set up media event listeners
  useEffect(() => {
    if (mediaRef.current) {
      const media = mediaRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(media.currentTime);
      };
      
      const handleDurationChange = () => {
        setDuration(media.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      const handlePlay = () => {
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleError = (e: Event) => {
        console.error('Media playback error:', e);
        if (content.cid && content.url && streamUrl !== content.url) {
          toast({
            title: "Playback Error",
            description: "Trying fallback source..."
          });
          media.src = content.url;
          media.load();
          if (isPlaying) media.play().catch(console.error);
        }
      };
      
      // Set up event listeners
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('durationchange', handleDurationChange);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('play', handlePlay);
      media.addEventListener('pause', handlePause);
      media.addEventListener('error', handleError);
      
      // Clean up
      return () => {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('durationchange', handleDurationChange);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('play', handlePlay);
        media.removeEventListener('pause', handlePause);
        media.removeEventListener('error', handleError);
      };
    }
  }, [mediaRef, streamUrl]); // Only depend on streamUrl, not functions or content object

  // Memoized handlers to prevent recreation on every render
  const handlePlayPause = useCallback(() => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(error => {
        console.error('Error playing media:', error);
        toast({
          title: "Playback Error",
          description: "Could not play the content. Please try again later."
        });
      });
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!mediaRef.current) return;
    
    setIsMuted(prevMuted => {
      const newMutedState = !prevMuted;
      mediaRef.current!.muted = newMutedState;
      
      if (!newMutedState) {
        mediaRef.current!.volume = volume;
      }
      
      return newMutedState;
    });
  }, [volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setVolume(newVolume);
      
      if (newVolume === 0) {
        mediaRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        mediaRef.current.muted = false;
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  // Memoize formatter to prevent recreation
  const formatTime = useMemo(() => {
    return (timeInSeconds: number): string => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
  }, []);

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
              controls={false}
              autoPlay={autoPlay}
              poster={content.thumbnail}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={streamUrl || ''}
                className="hidden"
                autoPlay={autoPlay}
              />
              <div className="text-white text-4xl">AUDIO</div>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-2">
          <button 
            onClick={handlePlayPause} 
            className="border border-black w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100"
            disabled={isLoading || (!contentAvailable && !content.url)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <div className="w-full flex-1 flex items-center space-x-2">
            <span className="text-xs font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              value={currentTime}
              min={0}
              max={duration || 0}
              step={0.1}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              disabled={isLoading || (!contentAvailable && !content.url)}
              aria-label="Seek"
            />
            <span className="text-xs font-mono">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              className="w-16 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
