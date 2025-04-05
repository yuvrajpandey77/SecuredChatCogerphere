
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [message, setMessage] = useState("");
  const { apiConfig } = useChat();

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      await onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4  border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto ">
        <div className="relative ">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiConfig.apiKey
                ? "Type your message here..."
                : "Please add your OpenRouter API key in settings first"
            }
            disabled={isLoading || !apiConfig.apiKey}
            className="min-h-16 pr-12 resize-none anime-input"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || !apiConfig.apiKey}
            className="absolute bottom-2 right-2 h-8 w-8 p-0 anime-button"
          >
            <Send size={16} />
          </Button>
        </div>
        <div className="text-xs text-center mt-2 text-muted-foreground">
          Cogerphere - Using OpenRouter API
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
