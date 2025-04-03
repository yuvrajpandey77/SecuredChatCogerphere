import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/context/ChatContext";
import { PlusCircle, Trash2, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SettingsPanel from "@/components/SettingsPanel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}


const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    chats,
    currentChatId,
    createNewChat,
    selectChat,
    deleteChat,
    clearChats,
  } = useChat();

  const handleNewChat = () => {
    createNewChat();
    onCloseMobile();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    onCloseMobile();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-border transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage 
                src="/lovable-uploads/a4ad0ddd-0884-4ced-9bf7-e01616e43974.png" 
                alt="Cogerphere Logo"
              />
              <AvatarFallback>CG</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-sidebar-foreground">
              -Cogerphere
            </h1>
          </div>
        </div>

        <Button
          variant="default"
          className="mb-4 anime-button flex gap-2 items-center bg-primary"
          onClick={handleNewChat}
        >
          <PlusCircle size={16} />
          New Chat
        </Button>

        <ScrollArea className="flex-1 -mx-4 px-4">
          {chats.length > 0 ? (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors",
                    currentChatId === chat.id && "bg-sidebar-accent"
                  )}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex items-center space-x-2 truncate overflow-hidden">
                    <MessageCircle
                      size={16}
                      className={cn(
                        "flex-shrink-0",
                        currentChatId === chat.id
                          ? "text-primary"
                          : "text-sidebar-foreground/70"
                      )}
                    />
                    <span className="truncate text-sm font-medium">
                      {chat.title}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} className="text-sidebar-foreground/70" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sidebar-foreground/70">
              <p>No chats yet</p>
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 space-y-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center justify-start"
              >
                <Settings size={16} />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <SettingsPanel />
            </DialogContent>
          </Dialog>

          {chats.length > 0 && (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive/80 flex gap-2 items-center justify-start"
              onClick={clearChats}
            >
              <Trash2 size={16} />
              Clear All Chats
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;