import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Chat, Message, ApiKeyConfig } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";

interface ChatContextProps {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  isLoadingConfig: boolean; // New loading state for config
  apiConfig: ApiKeyConfig;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearChats: () => void;
  sendMessage: (content: string) => Promise<void>;
  setApiConfig: (config: ApiKeyConfig) => void;
  stopStreaming: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CHATS: "cogerphere-chats",
  CURRENT_CHAT_ID: "cogerphere-current-chat-id",
  API_CONFIG: "cogerphere-api-config",
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [apiConfig, setApiConfigState] = useState<ApiKeyConfig>({
    apiKey: "",
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true); // New loading state for config
  const { toast } = useToast();

  // Add ref for AbortController to stop streaming
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Load data from localStorage
    const savedChats = localStorage.getItem(LOCAL_STORAGE_KEYS.CHATS);
    const savedCurrentChatId = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_CHAT_ID);
    const savedApiConfig = localStorage.getItem(LOCAL_STORAGE_KEYS.API_CONFIG);

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        // Convert string dates back to Date objects
        const processedChats = parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChats(processedChats);
      } catch (error) {
        console.error("Failed to parse saved chats:", error);
        toast({
          title: "Error",
          description: "Failed to load saved chats",
          variant: "destructive",
        });
      }
    }

    if (savedCurrentChatId) {
      setCurrentChatId(savedCurrentChatId);
    }

    if (savedApiConfig) {
      try {
        const config = JSON.parse(savedApiConfig);
        // Preserve API key but force Mistral as model
        const updatedConfig = {
          apiKey: config.apiKey || "",
          model: "mistralai/mistral-small-3.2-24b-instruct:free"
        };
        setApiConfigState(updatedConfig);
        // Save the updated config back to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEYS.API_CONFIG, JSON.stringify(updatedConfig));
      } catch (error) {
        console.error("Failed to parse saved API config:", error);
        // Set default model if parsing fails
        setApiConfigState({
          apiKey: "",
          model: "mistralai/mistral-small-3.2-24b-instruct:free",
        });
      }
    } else {
      // Set default model if no config exists
      setApiConfigState({
        apiKey: "",
        model: "mistralai/mistral-small-3.2-24b-instruct:free",
      });
    }

    // Set loading to false after all config is loaded
    setIsLoadingConfig(false);
  }, [toast]);

  // Save chats and currentChatId to localStorage when they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_CHAT_ID, currentChatId);
    }
  }, [currentChatId]);

  // Save API config to localStorage when it changes
  useEffect(() => {
    if (!isLoadingConfig) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));
    }
  }, [apiConfig, isLoadingConfig]);

  const setApiConfig = (config: ApiKeyConfig) => {
    setApiConfigState(config);
    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
    toast({
      title: "API Key Updated",
      description: "Your API configuration has been updated",
    });
  };

  const createNewChat = () => {
    const now = new Date();
    const newChat: Chat = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setChats((prevChats) => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
    
    return newChat.id;
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
    
    toast({
      title: "Chat Deleted",
      description: "The chat has been deleted",
    });
  };

  const clearChats = () => {
    setChats([]);
    setCurrentChatId(null);
    localStorage.removeItem("chats");
    localStorage.removeItem("currentChatId");
  };

  const updateChatTitle = (chatId: string, messages: Message[]) => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      const title = lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? "..." : "");
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, title } : chat
        )
      );
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!apiConfig.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in settings",
        variant: "destructive",
      });
      return;
    }

    let activeChatId = currentChatId;
    
    // If no chat is selected, create a new one
    if (!activeChatId) {
      activeChatId = createNewChat();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Add user message to chat
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage],
            updatedAt: new Date(),
          };
        }
        return chat;
      })
    );

    // Get all messages for context
    const currentChat = chats.find((chat) => chat.id === activeChatId);
    const chatMessages = currentChat ? [...currentChat.messages, userMessage] : [userMessage];
    
    setIsLoading(true);

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Create a placeholder assistant message for streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    // Add empty assistant message to chat for streaming
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: new Date(),
          };
        }
        return chat;
      })
    );

    try {
      // Using OpenRouter API for free models with streaming
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiConfig.apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Cogerphere"
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: chatMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: 0.7,
          stream: true, // Enable streaming
        }),
        signal: abortControllerRef.current.signal, // Add abort signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to get response from API");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0]?.delta?.content;
                
                if (delta) {
                  accumulatedContent += delta;
                  
                  // Update the assistant message with accumulated content
                  setChats((prevChats) =>
                    prevChats.map((chat) => {
                      if (chat.id === activeChatId) {
                        return {
                          ...chat,
                          messages: chat.messages.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: accumulatedContent }
                              : msg
                          ),
                          updatedAt: new Date(),
                        };
                      }
                      return chat;
                    })
                  );
                }
              } catch (e) {
                // Skip malformed JSON chunks
                continue;
              }
            }
          }
        }
        
        reader.releaseLock();
      }

      // Update chat title if needed
      if (activeChatId) {
        const updatedChat = chats.find((c) => c.id === activeChatId);
        if (updatedChat) {
          updateChatTitle(activeChatId, [...updatedChat.messages, { ...assistantMessage, content: accumulatedContent }]);
        }
      }
    } catch (error) {
      // Check if it's an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        // Remove the assistant message if aborted
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.id === activeChatId) {
              return {
                ...chat,
                messages: chat.messages.filter(msg => msg.id !== assistantMessageId),
                updatedAt: new Date(),
              };
            }
            return chat;
          })
        );
        return;
      }

      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });

      // Remove the assistant message if there was an error
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: chat.messages.filter(msg => msg.id !== assistantMessageId),
              updatedAt: new Date(),
            };
          }
          return chat;
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const value: ChatContextProps = {
    chats,
    currentChatId,
    isLoading,
    isLoadingConfig,
    apiConfig,
    createNewChat,
    selectChat,
    deleteChat,
    clearChats,
    sendMessage,
    setApiConfig,
    stopStreaming,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
