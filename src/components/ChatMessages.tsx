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
                "flex items-start space-x-4 animate-fade-in",
                message.role === "user" ? "justify-start" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full flex items-center justify-center",
                  message.role === "user"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {message.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>
              <div
                className={cn(
                  "anime-card p-4 max-w-[85%]",
                  message.role === "user"
                    ? "bg-secondary/80 border-secondary"
                    : "bg-card/80"
                )}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert text-left">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-4 animate-fade-in">
            <div className="p-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="anime-card p-4 max-w-[85%] bg-card/80">
              <div className="flex space-x-2">
                <div className="animate-pulse h-2 w-2 bg-muted-foreground/70 rounded-full"></div>
                <div className="animate-pulse delay-150 h-2 w-2 bg-muted-foreground/70 rounded-full"></div>
                <div className="animate-pulse delay-300 h-2 w-2 bg-muted-foreground/70 rounded-full"></div>
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
