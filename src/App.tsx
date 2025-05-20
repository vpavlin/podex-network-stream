import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { useEffect } from "react";
import { initWaku } from "./lib/waku";

// Pages
import Index from "./pages/Index";
import Discovery from "./pages/Discovery";
import Consumer from "./pages/Consumer";
import Publish from "./pages/Publish";
import ContentDetail from "./pages/ContentDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Layout
import AppLayout from "./components/AppLayout";

// Initialize React Query client
const queryClient = new QueryClient();

// Ethereum window type extension
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const App = () => {
  // Initialize Waku when the app starts
  useEffect(() => {
    const setupWaku = async () => {
      await initWaku();
    };
    setupWaku();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <SettingsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/discovery" element={<Discovery />} />
                  <Route path="/consumer" element={<Consumer />} />
                  <Route path="/publish" element={<Publish />} />
                  <Route path="/content/:id" element={<ContentDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SettingsProvider>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
