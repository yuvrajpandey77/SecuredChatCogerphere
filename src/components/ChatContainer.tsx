
import React, { useEffect } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface ChatContainerProps {
  onOpenMobileSidebar: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  onOpenMobileSidebar,
}) => {
  const {
    currentChatId,
    createNewChat,
    sendMessage,
    isLoading,
    getCurrentChat,
  } = useChat();

  useEffect(() => {
    if (!currentChatId) {
      createNewChat();
    }
  }, [currentChatId, createNewChat]);

  const currentChat = getCurrentChat();
  const messages = currentChat?.messages || [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onOpenMobileSidebar}
        >
          <Menu size={20} />
        </Button>
        <h2 className="text-lg font-medium">
          {currentChat?.title || "New Chat"}
        </h2>
      </header>

      <ChatMessages messages={messages} isLoading={isLoading} />
      
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
