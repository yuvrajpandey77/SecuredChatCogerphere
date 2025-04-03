import React, { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Moon, Sun } from "lucide-react";

const SettingsPanel: React.FC = () => {
  const { apiConfig, setApiConfig } = useChat();
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [localApiKey, setLocalApiKey] = useState(apiConfig.apiKey);
  const [localModel, setLocalModel] = useState(apiConfig.model);

  const handleSave = () => {
    setApiConfig({
      apiKey: localApiKey,
      model: localModel,
    });
  };

  return (
    <div className="space-y-6">
      {/* User profile section */}
      {userProfile && (
        <div className="flex flex-col items-center space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {userProfile.picture ? (
                <AvatarImage src={userProfile.picture} alt={userProfile.name} />
              ) : (
                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2"
            onClick={logout}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun size={18} className={theme === 'light' ? "text-orange-500" : "text-muted-foreground"} />
            <Label htmlFor="theme-toggle" className="text-sm">Dark Mode</Label>
            <Moon size={18} className={theme === 'dark' ? "text-blue-400" : "text-muted-foreground"} />
          </div>
          <Switch
            id="theme-toggle"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">OpenRouter API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-or-..."
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            className="anime-input"
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={localModel}
            onValueChange={setLocalModel}
          >
            <SelectTrigger id="model" className="anime-input">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
              <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus</SelectItem>
              <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              <SelectItem value="google/gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full anime-button" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;