
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  codexApiUrl: string;
  setCodexApiUrl: (url: string) => void;
  codexApiUsername: string;
  setCodexApiUsername: (username: string) => void;
  codexApiPassword: string;
  setCodexApiPassword: (password: string) => void;
  downloadApiUrl: string;
  setDownloadApiUrl: (url: string) => void;
  downloadApiUsername: string;
  setDownloadApiUsername: (username: string) => void;
  downloadApiPassword: string;
  setDownloadApiPassword: (password: string) => void;
}

export const defaultSettings = {
  codexApiUrl: 'http://localhost:8080',
  codexApiUsername: '',
  codexApiPassword: '',
  downloadApiUrl: 'http://localhost:8081',
  downloadApiUsername: '',
  downloadApiPassword: '',
};

const SettingsContext = createContext<SettingsContextType>({
  codexApiUrl: defaultSettings.codexApiUrl,
  setCodexApiUrl: () => {},
  codexApiUsername: defaultSettings.codexApiUsername,
  setCodexApiUsername: () => {},
  codexApiPassword: defaultSettings.codexApiPassword,
  setCodexApiPassword: () => {},
  downloadApiUrl: defaultSettings.downloadApiUrl,
  setDownloadApiUrl: () => {},
  downloadApiUsername: defaultSettings.downloadApiUsername,
  setDownloadApiUsername: () => {},
  downloadApiPassword: defaultSettings.downloadApiPassword,
  setDownloadApiPassword: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [codexApiUrl, setCodexApiUrl] = useState<string>(defaultSettings.codexApiUrl);
  const [codexApiUsername, setCodexApiUsername] = useState<string>(defaultSettings.codexApiUsername);
  const [codexApiPassword, setCodexApiPassword] = useState<string>(defaultSettings.codexApiPassword);
  const [downloadApiUrl, setDownloadApiUrl] = useState<string>(defaultSettings.downloadApiUrl);
  const [downloadApiUsername, setDownloadApiUsername] = useState<string>(defaultSettings.downloadApiUsername);
  const [downloadApiPassword, setDownloadApiPassword] = useState<string>(defaultSettings.downloadApiPassword);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('codexApiUrl');
    if (savedApiUrl) {
      setCodexApiUrl(savedApiUrl);
    }
    
    const savedCodexUsername = localStorage.getItem('codexApiUsername');
    if (savedCodexUsername) {
      setCodexApiUsername(savedCodexUsername);
    }
    
    const savedCodexPassword = localStorage.getItem('codexApiPassword');
    if (savedCodexPassword) {
      setCodexApiPassword(savedCodexPassword);
    }
    
    const savedDownloadApiUrl = localStorage.getItem('downloadApiUrl');
    if (savedDownloadApiUrl) {
      setDownloadApiUrl(savedDownloadApiUrl);
    }
    
    const savedDownloadUsername = localStorage.getItem('downloadApiUsername');
    if (savedDownloadUsername) {
      setDownloadApiUsername(savedDownloadUsername);
    }
    
    const savedDownloadPassword = localStorage.getItem('downloadApiPassword');
    if (savedDownloadPassword) {
      setDownloadApiPassword(savedDownloadPassword);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('codexApiUrl', codexApiUrl);
  }, [codexApiUrl]);
  
  useEffect(() => {
    localStorage.setItem('codexApiUsername', codexApiUsername);
  }, [codexApiUsername]);
  
  useEffect(() => {
    localStorage.setItem('codexApiPassword', codexApiPassword);
  }, [codexApiPassword]);
  
  useEffect(() => {
    localStorage.setItem('downloadApiUrl', downloadApiUrl);
  }, [downloadApiUrl]);
  
  useEffect(() => {
    localStorage.setItem('downloadApiUsername', downloadApiUsername);
  }, [downloadApiUsername]);
  
  useEffect(() => {
    localStorage.setItem('downloadApiPassword', downloadApiPassword);
  }, [downloadApiPassword]);

  return (
    <SettingsContext.Provider 
      value={{ 
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
