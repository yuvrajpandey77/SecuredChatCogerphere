
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
    chats,
    createNewChat,
    sendMessage,
    isLoading,
  } = useChat();

  useEffect(() => {
    if (!currentChatId) {
      createNewChat();
    }
  }, [currentChatId, createNewChat]);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onOpenMobileSidebar}
        >
          <Menu size={20} />
        </Button>
    
      </header>

      <ChatMessages messages={messages} isLoading={isLoading} />
      
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
