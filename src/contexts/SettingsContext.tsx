
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  codexApiUrl: string;
  setCodexApiUrl: (url: string) => void;
  downloadApiUrl: string;
  setDownloadApiUrl: (url: string) => void;
}

export const defaultSettings = {
  codexApiUrl: 'http://localhost:8080',
  downloadApiUrl: 'http://localhost:8081',
};

const SettingsContext = createContext<SettingsContextType>({
  codexApiUrl: defaultSettings.codexApiUrl,
  setCodexApiUrl: () => {},
  downloadApiUrl: defaultSettings.downloadApiUrl,
  setDownloadApiUrl: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [codexApiUrl, setCodexApiUrl] = useState<string>(defaultSettings.codexApiUrl);
  const [downloadApiUrl, setDownloadApiUrl] = useState<string>(defaultSettings.downloadApiUrl);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('codexApiUrl');
    if (savedApiUrl) {
      setCodexApiUrl(savedApiUrl);
    }
    
    const savedDownloadApiUrl = localStorage.getItem('downloadApiUrl');
    if (savedDownloadApiUrl) {
      setDownloadApiUrl(savedDownloadApiUrl);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('codexApiUrl', codexApiUrl);
  }, [codexApiUrl]);
  
  useEffect(() => {
    localStorage.setItem('downloadApiUrl', downloadApiUrl);
  }, [downloadApiUrl]);

  return (
    <SettingsContext.Provider 
      value={{ 
        codexApiUrl, 
        setCodexApiUrl, 
        downloadApiUrl, 
        setDownloadApiUrl 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
