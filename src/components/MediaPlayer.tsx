
import { useRef, useEffect, useState } from 'react';
import { Content } from '@/lib/db';

interface MediaPlayerProps {
  content: Content;
  autoPlay?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ content, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

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
      
      // Set up event listeners
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('durationchange', handleDurationChange);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('play', handlePlay);
      media.addEventListener('pause', handlePause);
      
      // Clean up
      return () => {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('durationchange', handleDurationChange);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('play', handlePlay);
        media.removeEventListener('pause', handlePause);
      };
    }
  }, [mediaRef]);

  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="w-full border border-black bg-white">
      <div className="w-full aspect-video bg-black">
        {content.type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={content.url}
            className="w-full h-full"
            controls={false}
            autoPlay={autoPlay}
            poster={content.thumbnail}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={content.url}
              className="hidden"
              autoPlay={autoPlay}
            />
            <div className="text-white text-4xl">AUDIO</div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-2">
          <button 
            onClick={handlePlayPause} 
            className="border border-black w-8 h-8 flex items-center justify-center"
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          
          <div className="w-full flex-1 flex items-center space-x-2">
            <span className="text-xs">{formatTime(currentTime)}</span>
            <input
              type="range"
              value={currentTime}
              min={0}
              max={duration || 0}
              step={0.1}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-200 appearance-none"
            />
            <span className="text-xs">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
