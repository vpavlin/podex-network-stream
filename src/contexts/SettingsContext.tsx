
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  codexApiUrl: string;
  setCodexApiUrl: (url: string) => void;
}

const defaultSettings = {
  codexApiUrl: 'http://localhost:8080',
};

const SettingsContext = createContext<SettingsContextType>({
  codexApiUrl: defaultSettings.codexApiUrl,
  setCodexApiUrl: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [codexApiUrl, setCodexApiUrl] = useState<string>(defaultSettings.codexApiUrl);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('codexApiUrl');
    if (savedApiUrl) {
      setCodexApiUrl(savedApiUrl);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('codexApiUrl', codexApiUrl);
  }, [codexApiUrl]);

  return (
    <SettingsContext.Provider value={{ codexApiUrl, setCodexApiUrl }}>
      {children}
    </SettingsContext.Provider>
  );
};
