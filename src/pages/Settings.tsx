
import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { codexApiUrl, setCodexApiUrl } = useSettings();
  const [apiUrl, setApiUrl] = useState(codexApiUrl);

  const handleSave = () => {
    setCodexApiUrl(apiUrl);
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully."
    });
  };

  return (
    <div className="container py-6">
      <h1 className="text-xl font-bold mb-6">SETTINGS</h1>
      
      <div className="border border-black p-6">
        <div className="mb-4">
          <label htmlFor="apiUrl" className="block mb-2 font-medium">
            Codex API URL
          </label>
          <input
            id="apiUrl"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full p-2 border border-black"
          />
          <p className="text-sm text-gray-600 mt-1">
            The base URL for the Codex API (default: http://localhost:8080/api/codex/v1)
          </p>
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
