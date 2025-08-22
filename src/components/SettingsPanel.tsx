import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
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
import { Moon, Sun } from "lucide-react";

const SettingsPanel: React.FC = () => {
  const { apiConfig, setApiConfig } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [localApiKey, setLocalApiKey] = useState(apiConfig.apiKey);
  const [localModel, setLocalModel] = useState(apiConfig.model);

  // Sync local state with apiConfig changes
  useEffect(() => {
    setLocalApiKey(apiConfig.apiKey);
    // Ensure we always have a valid model, defaulting to Mistral if none is set
    setLocalModel(apiConfig.model || "mistralai/mistral-small-3.2-24b-instruct:free");
  }, [apiConfig]);

  const handleSave = () => {
    // Ensure we always save with a valid model, defaulting to Mistral if none is set
    const modelToSave = localModel || "mistralai/mistral-small-3.2-24b-instruct:free";
    
    // If this is a new API key and the model is still the old Gemma default, 
    // automatically switch to Mistral
    let finalModel = modelToSave;
    if (localApiKey !== apiConfig.apiKey && 
        (modelToSave === "google/gemma-2-9b-it:free" || !modelToSave)) {
      finalModel = "mistralai/mistral-small-3.2-24b-instruct:free";
      setLocalModel(finalModel);
    }
    
    setApiConfig({
      apiKey: localApiKey,
      model: finalModel,
    });
  };

  return (
    <div className="space-y-6">
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
          <Label htmlFor="model">AI Model</Label>
          <Select
            value={localModel}
            onValueChange={setLocalModel}
          >
            <SelectTrigger id="model" className="anime-input">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mistralai/mistral-small-3.2-24b-instruct:free">Mistral Small 3.2 (24B) (Default)</SelectItem>
              <SelectItem value="google/gemma-2-9b-it:free">Gemma 2 9B IT</SelectItem>
              <SelectItem value="nousresearch/deephermes-3-llama-3-8b-preview:free">DeepHermes 3 (Llama 3 8B)</SelectItem>
              <SelectItem value="deepseek/deepseek-r1-0528-qwen3-8b:free">DeepSeek R1 (Qwen3 8B)</SelectItem>
              <SelectItem value="rekaai/reka-flash-3:free">Reka Flash 3</SelectItem>
              <SelectItem value="deepseek/deepseek-r1-distill-llama-70b:free">DeepSeek R1 Distill (Llama 70B)</SelectItem>
              <SelectItem value="openai/gpt-oss-20b:free">GPT-OSS 20B</SelectItem>
              <SelectItem value="z-ai/glm-4.5-air:free">GLM 4.5 Air</SelectItem>
              <SelectItem value="qwen/qwen3-coder:free">Qwen3 Coder</SelectItem>
              <SelectItem value="moonshotai/kimi-k2:free">Kimi K2</SelectItem>
              <SelectItem value="tencent/hunyuan-a13b-instruct:free">Hunyuan A13B Instruct</SelectItem>
              <SelectItem value="moonshotai/kimi-dev-72b:free">Kimi Dev 72B</SelectItem>
              <SelectItem value="sarvamai/sarvam-m:free">Sarvam M</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All models are free to use with your OpenRouter API key.
          </p>
        </div>

        <Button className="w-full anime-button" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;