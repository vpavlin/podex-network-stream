
import { useState } from 'react';
import { defaultSettings, useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FollowingList from '@/components/FollowingList';

const Settings = () => {
  const { 
    codexApiUrl, 
    setCodexApiUrl, 
    codexApiUsername, 
    setCodexApiUsername,
    codexApiPassword,
    setCodexApiPassword,
    downloadApiUrl, 
    setDownloadApiUrl,
    downloadApiUsername,
    setDownloadApiUsername,
    downloadApiPassword,
    setDownloadApiPassword 
  } = useSettings();
  
  const [apiUrl, setApiUrl] = useState(codexApiUrl);
  const [apiUsername, setApiUsername] = useState(codexApiUsername);
  const [apiPassword, setApiPassword] = useState(codexApiPassword);
  const [downloadUrl, setDownloadUrl] = useState(downloadApiUrl);
  const [downloadUsername, setDownloadUsername] = useState(downloadApiUsername);
  const [downloadPassword, setDownloadPassword] = useState(downloadApiPassword);

  const handleSave = () => {
    setCodexApiUrl(apiUrl);
    setCodexApiUsername(apiUsername);
    setCodexApiPassword(apiPassword);
    setDownloadApiUrl(downloadUrl);
    setDownloadApiUsername(downloadUsername);
    setDownloadApiPassword(downloadPassword);
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully."
    });
  };

  return (
    <div className="container py-6">
      <h1 className="text-xl font-bold mb-6">SETTINGS</h1>
      
      <div className="mb-6">
        <FollowingList />
      </div>
      
      <div className="border border-black p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Codex API Settings</h2>
          
          <div className="mb-4">
            <Label htmlFor="apiUrl" className="block mb-2 font-medium">
              Codex API URL
            </Label>
            <Input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full p-2 border border-black"
            />
            <p className="text-sm text-gray-600 mt-1">
              The base URL for the Codex API (default: {defaultSettings.codexApiUrl})
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiUsername" className="block mb-2 font-medium">
                Username (Optional)
              </Label>
              <Input
                id="apiUsername"
                type="text"
                value={apiUsername}
                onChange={(e) => setApiUsername(e.target.value)}
                className="w-full p-2 border border-black"
                placeholder="Basic auth username"
              />
            </div>
            
            <div>
              <Label htmlFor="apiPassword" className="block mb-2 font-medium">
                Password (Optional)
              </Label>
              <Input
                id="apiPassword"
                type="password"
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                className="w-full p-2 border border-black"
                placeholder="Basic auth password"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Download API Settings</h2>
          
          <div className="mb-4">
            <Label htmlFor="downloadApiUrl" className="block mb-2 font-medium">
              Download API URL
            </Label>
            <Input
              id="downloadApiUrl"
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full p-2 border border-black"
            />
            <p className="text-sm text-gray-600 mt-1">
              The base URL for the Download API service (default: {defaultSettings.downloadApiUrl})
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="downloadUsername" className="block mb-2 font-medium">
                Username (Optional)
              </Label>
              <Input
                id="downloadUsername"
                type="text"
                value={downloadUsername}
                onChange={(e) => setDownloadUsername(e.target.value)}
                className="w-full p-2 border border-black"
                placeholder="Basic auth username"
              />
            </div>
            
            <div>
              <Label htmlFor="downloadPassword" className="block mb-2 font-medium">
                Password (Optional)
              </Label>
              <Input
                id="downloadPassword"
                type="password"
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
                className="w-full p-2 border border-black"
                placeholder="Basic auth password"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSave}
            className="border border-black px-6 py-2 hover:bg-black hover:text-white"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
