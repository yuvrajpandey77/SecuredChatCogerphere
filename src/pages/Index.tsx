
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatContainer from "@/components/ChatContainer";
import { ChatProvider, useChat } from "@/context/ChatContext";
import ModelSelection from "@/components/ModelSelection";
import { Analytics } from "@vercel/analytics/react";

const IndexContent = () => {
  const { apiConfig, isLoadingConfig } = useChat();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);

  // Wait for config to load before deciding to show model selection
  useEffect(() => {
    if (!isLoadingConfig) {
      if (!apiConfig.apiKey) {
        setShowModelSelection(true);
      } else {
        setShowModelSelection(false);
      }
    }
  }, [isLoadingConfig, apiConfig.apiKey]);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  
  const handleModelSelectionComplete = () => {
    setShowModelSelection(false);
  };

  // Show loading state while config is being loaded
  if (isLoadingConfig) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />
      <Analytics />
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileSidebar}
          />
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-[280px] z-50 md:hidden"
            onClick={closeMobileSidebar}
          >
            <X size={20} />
          </Button>
        </>
      )}
      
      <main className="flex-1 flex flex-col md:ml-72">
        <ChatContainer onOpenMobileSidebar={openMobileSidebar} />
      </main>
      
      {/* Model selection modal - only show when no API key */}
      {showModelSelection && (
        <ModelSelection onComplete={handleModelSelectionComplete} />
      )}
    </div>
  );
};

const Index = () => {
  return (
    <ChatProvider>
      <IndexContent />
    </ChatProvider>
  );
};

export default Index;
