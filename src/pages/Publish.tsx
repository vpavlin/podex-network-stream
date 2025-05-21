
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useWallet } from '@/contexts/WalletContext';
import { Content, db, UserContent } from '@/lib/db';
import { toast } from '@/hooks/use-toast';
import { useCodexApi } from '@/lib/codex';
import { announceContent } from '@/lib/waku';
import { PodexManifest } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';

const Publish = () => {
  const { address } = useWallet();
  const navigate = useNavigate();
  const { uploadToCodex } = useCodexApi();
  const { downloadApiUrl } = useSettings();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'audio' | 'video'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [publishMode, setPublishMode] = useState<'upload' | 'external'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleDownloadFromUrl = async () => {
    if (!externalUrl) {
      toast({ 
        title: "No URL Provided", 
        description: "Please enter a valid URL to download content from." 
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Call the download API to fetch the content
      const response = await fetch(`${downloadApiUrl}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: externalUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Download API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Create a file from the downloaded content
      const contentBlob = await fetch(result.contentUrl).then(r => r.blob());
      const downloadedFile = new File([contentBlob], result.filename || "downloaded-content", { 
        type: result.contentType || (contentType === 'video' ? 'video/mp4' : 'audio/mpeg') 
      });
      
      setFile(downloadedFile);
      
      // If thumbnail is available and no custom thumbnail was selected
      if (result.thumbnailUrl && !thumbnail) {
        const thumbnailBlob = await fetch(result.thumbnailUrl).then(r => r.blob());
        const thumbnailFile = new File([thumbnailBlob], "thumbnail.jpg", { type: 'image/jpeg' });
        setThumbnail(thumbnailFile);
      }
      
      // Set metadata from the external content if available
      if (result.title && !title) {
        setTitle(result.title);
      }
      
      if (result.description && !description) {
        setDescription(result.description);
      }
      
      toast({ 
        title: "Content Downloaded", 
        description: "The external content has been downloaded successfully." 
      });
      
      // Switch to upload mode with the downloaded content
      setPublishMode('upload');
      
    } catch (error) {
      console.error('Error downloading content:', error);
      toast({ 
        title: "Download Failed", 
        description: "There was an error downloading the content. Please try again." 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!address) {
      toast({ 
        title: "Wallet Not Connected", 
        description: "Please connect your wallet to publish content." 
      });
      return;
    }
    
    if (!file) {
      toast({ 
        title: "No File Selected", 
        description: "Please select a file to upload or download from an external URL." 
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload to Codex and get CID
      const { cid, url } = await uploadToCodex(file);
      
      let thumbnailUrl = '';
      let thumbnailCid = '';
      if (thumbnail) {
        const thumbnailUpload = await uploadToCodex(thumbnail);
        thumbnailUrl = thumbnailUpload.url;
        thumbnailCid = thumbnailUpload.cid;
      }

      const podexManifest: PodexManifest = {
        title,
        description,
        type: contentType,
        publisher: address,
        publishedAt: Date.now(),
        thumbnailCid: thumbnailCid,
        contentCid: cid,
      }

      const podexManifestFile = new File([JSON.stringify(podexManifest)], "podexManifest.json", {type: "application/json"})
      const podexManifestUpload = await uploadToCodex(podexManifestFile)
      
      // Announce the content to the Waku network
      const res = await announceContent({...podexManifest, cid: podexManifestUpload.cid})

      if (!res) throw new Error("Failed to publish")

      const contentId = podexManifestUpload.cid

      // Create content object
      const contentData: Content = {
        id: contentId,
        title,
        description,
        type: contentType,
        url,
        cid,
        thumbnail: thumbnailUrl,
        thumbnailCid: thumbnailCid,
        publisher: address,
        publishedAt: Date.now()
      };
      
      // Create user content record
      const userContent: UserContent = {
        id: uuidv4(),
        contentId,
        status: 'published',
        uploadedAt: Date.now()
      };
      
      await db.addUserContent(userContent);
      
      toast({ 
        title: "Content Published", 
        description: "Your content has been successfully published to the decentralized network." 
      });
      
      // Navigate to the content page using CID
      navigate(`/content/${contentId}`);
      
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({ 
        title: "Upload Failed", 
        description: "There was an error publishing your content. Please try again." 
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!address) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center border border-black p-12">
          <h2 className="text-xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="mb-4">Please connect your Ethereum wallet to publish content.</p>
          <p className="text-sm text-gray-600">Your content will be associated with your wallet address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-xl font-bold mb-6">PUBLISH CONTENT</h1>
      
      <div className="border border-black p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Choose Publishing Method</h2>
        
        <div className="flex space-x-4 mb-6">
          <button 
            className={`px-4 py-2 border ${publishMode === 'upload' ? 'bg-black text-white' : 'border-black'}`}
            onClick={() => setPublishMode('upload')}
          >
            Upload File
          </button>
          <button 
            className={`px-4 py-2 border ${publishMode === 'external' ? 'bg-black text-white' : 'border-black'}`}
            onClick={() => setPublishMode('external')}
          >
            Import from URL
          </button>
        </div>
        
        {publishMode === 'external' && (
          <div className="mb-6">
            <label htmlFor="externalUrl" className="block mb-2 font-medium">
              Content URL (YouTube, X Spaces, etc.)
            </label>
            <div className="flex space-x-2">
              <Input
                id="externalUrl"
                type="text"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-grow"
              />
              <button
                onClick={handleDownloadFromUrl}
                disabled={isDownloading || !externalUrl}
                className="border border-black px-4 py-2 hover:bg-black hover:text-white disabled:opacity-50"
              >
                {isDownloading ? 'Downloading...' : 'Import'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Download content from external platforms to publish on Podex.
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border border-black p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block mb-2 font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border border-black"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block mb-2 font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-2 border border-black"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Content Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="video"
                checked={contentType === 'video'}
                onChange={() => setContentType('video')}
                className="mr-2"
              />
              Video
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="audio"
                checked={contentType === 'audio'}
                onChange={() => setContentType('audio')}
                className="mr-2"
              />
              Audio
            </label>
          </div>
        </div>
        
        {publishMode === 'upload' && (
          <div className="mb-4">
            <label htmlFor="file" className="block mb-2 font-medium">
              {contentType === 'video' ? 'Video File' : 'Audio File'}
            </label>
            <input
              id="file"
              type="file"
              accept={contentType === 'video' ? 'video/*' : 'audio/*'}
              onChange={handleFileChange}
              required={!file}
              className="w-full p-2 border border-black"
            />
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="thumbnail" className="block mb-2 font-medium">
            Thumbnail Image (Optional)
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full p-2 border border-black"
          />
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isUploading}
            className="border border-black px-6 py-2 hover:bg-black hover:text-white disabled:opacity-50"
          >
            {isUploading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Publish;
