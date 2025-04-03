
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatContainer from "@/components/ChatContainer";
import { ChatProvider } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";
import ModelSelection from "@/components/ModelSelection";
import { Analytics } from "@vercel/analytics/react";
const Index = () => {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Show model selection on first login
  React.useEffect(() => {
    if (isAuthenticated && !setupComplete) {
      setShowModelSelection(true);
    }
  }, [isAuthenticated, setupComplete]);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  
  const handleModelSelectionComplete = () => {
    setShowModelSelection(false);
    setSetupComplete(true);
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ChatProvider>
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
        
        {/* Model selection modal */}
        {showModelSelection && (
          <ModelSelection onComplete={handleModelSelectionComplete} />
        )}
      </div>
    </ChatProvider>
  );
};

export default Index;
