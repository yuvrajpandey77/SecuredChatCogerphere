import React, { createContext, useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Chat, Message, ApiKeyConfig } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";

interface ChatContextProps {
  chats: Chat[];
  currentChatId: string | null;
  apiConfig: ApiKeyConfig;
  setApiConfig: (config: ApiKeyConfig) => void;
  isLoading: boolean;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChats: () => void;
  getCurrentChat: () => Chat | undefined;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CHATS: "anime-chat-guru-chats",
  CURRENT_CHAT_ID: "anime-chat-guru-current-chat-id",
  API_CONFIG: "anime-chat-guru-api-config",
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [apiConfig, setApiConfigState] = useState<ApiKeyConfig>({
    apiKey: "",
    model: "openai/gpt-4o-mini",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        setApiConfigState(JSON.parse(savedApiConfig));
      } catch (error) {
        console.error("Failed to parse saved API config:", error);
      }
    }
  }, [toast]);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHATS, JSON.stringify(chats));
    
    if (currentChatId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_CHAT_ID, currentChatId);
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));
  }, [chats, currentChatId, apiConfig]);

  const setApiConfig = (config: ApiKeyConfig) => {
    setApiConfigState(config);
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
    
    toast({
      title: "Chats Cleared",
      description: "All chats have been cleared",
    });
  };

  const getCurrentChat = () => {
    return chats.find((chat) => chat.id === currentChatId);
  };

  const updateChatTitle = (chatId: string, messages: Message[]) => {
    // Only update title if this is a new chat with 2 messages (user + assistant's first response)
    const chat = chats.find((c) => c.id === chatId);
    
    if (chat && chat.title === "New Chat" && messages.length >= 2) {
      const userMessage = messages.find((m) => m.role === "user")?.content || "";
      // Generate a title based on the first user message
      const title = userMessage.length > 30 
        ? `${userMessage.substring(0, 30)}...` 
        : userMessage;
      
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId ? { ...c, title } : c
        )
      );
    }
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

    try {
      // Using OpenRouter API instead of OpenAI API
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to get response from API");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      // Add assistant message to chat (but don't re-add the user message)
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

      // Update chat title if needed
      if (activeChatId) {
        const updatedChat = chats.find((c) => c.id === activeChatId);
        if (updatedChat) {
          updateChatTitle(activeChatId, [...updatedChat.messages, assistantMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });

      // Remove the user message if there was an error
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              // Keep the message but mark it as failed
              messages: chat.messages.map(msg => 
                msg.id === userMessage.id 
                  ? { ...msg, error: true } 
                  : msg
              ),
              updatedAt: new Date(),
            };
          }
          return chat;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: ChatContextProps = {
    chats,
    currentChatId,
    apiConfig,
    setApiConfig,
    isLoading,
    createNewChat,
    selectChat,
    deleteChat,
    sendMessage,
    clearChats,
    getCurrentChat,
  };

  return (
    <ChatContext.Provider value={contextValue}>
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
