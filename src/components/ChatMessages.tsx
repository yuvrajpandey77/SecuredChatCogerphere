import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types/chat";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Welcome to Cogerphere!
              </h2>
              <p className="text-muted-foreground mb-6">
                Start a conversation with AI using your OpenRouter API key.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="anime-card p-4">
                  <h3 className="font-medium mb-2">Example Questions</h3>
                  <ul className="text-left text-sm space-y-2">
                    <li>• How can I improve my coding skills?</li>
                    <li>• What are the latest trends in AI and machine learning?</li>
                    <li>• Can you explain the concept of blockchain technology?</li>
                  </ul>
                </div>
                <div className="anime-card p-4">
                  <h3 className="font-medium mb-2">Capabilities</h3>
                  <ul className="text-left text-sm space-y-2">
                    <li>• Use your own OpenRouter API key</li>
                    <li>• Choose from various AI models</li>
                    <li>• Save and manage conversations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "w-full streaming-message",
                message.role === "user" ? "flex justify-end" : "flex justify-start"
              )}
            >
              <div
                className={cn(
                  "flex items-start space-x-4 animate-fade-in",
                  message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                )}
              >
                {/* Avatar - only show for AI messages */}
                {/* Removed bot logo to move response further left */}
                
                {/* Message content */}
                <div
                  className={cn(
                    "anime-card p-4",
                    message.role === "user"
                      ? "bg-secondary/80 border-secondary max-w-[85%] min-w-[45px] text-center" // User messages: better width, minimum width, centered text
                      : "bg-card/80 max-w-full" // AI messages: left-aligned, full width
                  )}
                >
                  <div className={cn(
                    "prose prose-sm max-w-none dark:prose-invert",
                    message.role === "user" ? "text-left" : "text-left" // Center user text, left-align AI text
                  )}>
                    <div className="streaming-text">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      {/* Add typing cursor for empty assistant messages (streaming) */}
                      {message.role === "assistant" && message.content === "" && (
                        <span className="inline-block w-0.5 h-4 bg-primary typing-cursor ml-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Show "AI is thinking" only when loading and no assistant message exists yet */}
        {isLoading && !messages.some(msg => msg.role === "assistant") && (
          <div className="flex items-start space-x-4 animate-fade-in">
            <div className="p-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="anime-card p-4 max-w-[85%] bg-card/80">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">AI is thinking</span>
                <div className="flex space-x-1">
                  <div className="animate-bounce h-2 w-2 bg-primary rounded-full" style={{ animationDelay: '0ms' }}></div>
                  <div className="animate-bounce h-2 w-2 bg-primary rounded-full" style={{ animationDelay: '150ms' }}></div>
                  <div className="animate-bounce h-2 w-2 bg-primary rounded-full" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* This div is for scrolling to the bottom */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;