import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useWallet } from '@/contexts/WalletContext';
import { Content, db, UserContent } from '@/lib/db';
import { toast } from '@/hooks/use-toast';
import { useCodexApi } from '@/lib/codex';
import { announceContent } from '@/lib/waku';

const Publish = () => {
  const { address } = useWallet();
  const navigate = useNavigate();
  const { uploadToCodex } = useCodexApi();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'audio' | 'video'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        description: "Please select a file to upload." 
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload to Codex and get CID
      const { cid, url } = await uploadToCodex(file);
      
      // We'll now use the CID as the primary ID for content
      const contentId = cid;
      
      let thumbnailUrl = '';
      let thumbnailCid = '';
      if (thumbnail) {
        const thumbnailUpload = await uploadToCodex(thumbnail);
        thumbnailUrl = thumbnailUpload.url;
        thumbnailCid = thumbnailUpload.cid;
      }
      
      // Create content object
      const contentData: Content = {
        id: contentId, // Use CID as ID
        title,
        description,
        type: contentType,
        url,
        cid, // This will be the same as id now
        thumbnail: thumbnailUrl,
        thumbnailCid: thumbnailCid,
        publisher: address,
        publishedAt: Date.now()
      };
      
      // Store in IndexedDB
      await db.addContent(contentData);
      
      // Create user content record
      const userContent: UserContent = {
        id: uuidv4(), // Still use UUID for the user content record
        contentId, // Reference the content by its CID
        status: 'published',
        uploadedAt: Date.now()
      };
      
      await db.addUserContent(userContent);
      
      // Announce the content to the Waku network
      await announceContent({
        cid: contentId,
        title,
        description,
        type: contentType,
        publisher: address,
        publishedAt: Date.now()
      });
      
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
        
        <div className="mb-4">
          <label htmlFor="file" className="block mb-2 font-medium">
            {contentType === 'video' ? 'Video File' : 'Audio File'}
          </label>
          <input
            id="file"
            type="file"
            accept={contentType === 'video' ? 'video/*' : 'audio/*'}
            onChange={handleFileChange}
            required
            className="w-full p-2 border border-black"
          />
        </div>
        
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
