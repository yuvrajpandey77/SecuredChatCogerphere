
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Bot, ChevronDown, Globe, Paperclip, Square } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [message, setMessage] = useState("");
  const { apiConfig, setApiConfig, stopStreaming, isLoadingConfig } = useChat();

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

  const handleStop = () => {
    stopStreaming();
  };

  // Function to get a short model name for display
  const getShortModelName = (model: string) => {
    if (model.includes("mistral")) return "Mistral Small 3.2";
    if (model.includes("gemma")) return "Gemma 2 9B IT";
    if (model.includes("deephermes")) return "DeepHermes 3";
    if (model.includes("deepseek")) return "DeepSeek R1";
    if (model.includes("reka")) return "Reka Flash 3";
    if (model.includes("gpt")) return "GPT-OSS 20B";
    if (model.includes("glm")) return "GLM 4.5 Air";
    if (model.includes("qwen")) return "Qwen3 Coder";
    if (model.includes("kimi")) return "Kimi K2";
    if (model.includes("hunyuan")) return "Hunyuan A13B";
    if (model.includes("sarvam")) return "Sarvam M";
    return "AI Model";
  };

  // Function to get a friendly model name for display
  const getFriendlyModelName = (model: string) => {
    if (model.includes("gemma")) return "Gemma 2 9B IT";
    if (model.includes("deephermes")) return "DeepHermes 3 (Llama 3 8B)";
    if (model.includes("deepseek")) return "DeepSeek R1 (Qwen3 8B)";
    if (model.includes("reka")) return "Reka Flash 3";
    if (model.includes("gpt")) return "GPT-OSS 20B";
    if (model.includes("glm")) return "GLM 4.5 Air";
    if (model.includes("qwen")) return "Qwen3 Coder";
    if (model.includes("kimi")) return "Kimi K2";
    if (model.includes("hunyuan")) return "Hunyuan A13B Instruct";
    if (model.includes("mistral")) return "Mistral Small 3.2 (24B)";
    if (model.includes("sarvam")) return "Sarvam M";
    return "AI Model";
  };

  const handleModelChange = (newModel: string) => {
    setApiConfig({
      apiKey: apiConfig.apiKey,
      model: newModel,
    });
  };

  return (
    <div className="p-2 border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        {/* Main input field with integrated buttons */}
        <div className="relative -mb-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoadingConfig 
                ? "Loading..." 
                : apiConfig.apiKey
                ? "Type your message here..."
                : "Please add your OpenRouter API key in settings first"
            }
            disabled={isLoading || isLoadingConfig || !apiConfig.apiKey}
            className="min-h-32 max-h-96 resize-none anime-input rounded-xl text-base pt-3 pl-3 text-left focus:outline focus:ring-0 "
            style={{
              height: 'auto',
              minHeight: '8rem', // 32 * 0.25rem = 8rem (increased by 30% from 6rem)
              maxHeight: '24rem', // 96 * 0.25rem = 24rem (increased by 30% from 18rem)
              overflowY: message.length > 500 ? 'auto' : 'hidden', // Show scrollbar only when needed
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 24 * 16) + 'px';
            }}
          />
          
          {/* Bottom left buttons: Model Selector, Search, File */}
          <div className="absolute left-2 bottom-2 flex items-center space-x-2">
            {/* Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-sm bg-background/50 hover:bg-background/80 border border-border/50"
                >
                  <Bot size={15} className="mr-1" />
                  {getShortModelName(apiConfig.model)}
                  <ChevronDown size={13} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2">
                  <h4 className="font-medium mb-2">Select AI Model</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    <DropdownMenuItem onClick={() => handleModelChange("mistralai/mistral-small-3.2-24b-instruct:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Mistral Small 3.2 (Default)</span>
                        <span className="text-xs text-muted-foreground">24B instruction model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("google/gemma-2-9b-it:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Gemma 2 9B IT</span>
                        <span className="text-xs text-muted-foreground">Google's latest open model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("nousresearch/deephermes-3-llama-3-8b-preview:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">DeepHermes 3</span>
                        <span className="text-xs text-muted-foreground">Llama 3 8B preview model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("deepseek/deepseek-r1-0528-qwen3-8b:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">DeepSeek R1</span>
                        <span className="text-xs text-muted-foreground">Qwen3 8B model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("rekaai/reka-flash-3:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Reka Flash 3</span>
                        <span className="text-xs text-muted-foreground">Fast and efficient model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("deepseek/deepseek-r1-distill-llama-70b:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">DeepSeek R1 Distill</span>
                        <span className="text-xs text-muted-foreground">Distilled Llama 70B model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("openai/gpt-oss-20b:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">GPT-OSS 20B</span>
                        <span className="text-xs text-muted-foreground">Open source GPT model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("z-ai/glm-4.5-air:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">GLM 4.5 Air</span>
                        <span className="text-xs text-muted-foreground">Z-AI's latest model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("qwen/qwen3-coder:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Qwen3 Coder</span>
                        <span className="text-xs text-muted-foreground">Specialized for coding</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("moonshotai/kimi-k2:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Kimi K2</span>
                        <span className="text-xs text-muted-foreground">Moonshot AI model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("tencent/hunyuan-a13b-instruct:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Hunyuan A13B</span>
                        <span className="text-xs text-muted-foreground">Tencent's instruction model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("mistralai/mistral-small-3.2-24b-instruct:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Mistral Small 3.2</span>
                        <span className="text-xs text-muted-foreground">24B instruction model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("moonshotai/kimi-dev-72b:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Kimi Dev 72B</span>
                        <span className="text-xs text-muted-foreground">Development focused model</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleModelChange("sarvamai/sarvam-m:free")}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Sarvam M</span>
                        <span className="text-xs text-muted-foreground">Sarvam AI model</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 bg-background/50 hover:bg-background/80 border border-border/50"
                  >
                    <Globe size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* File Attachment Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 bg-background/50 hover:bg-background/80 border border-border/50"
                  >
                    <Paperclip size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Bottom right button: Send/Stop */}
          <div className="absolute right-2 bottom-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={isLoading ? handleStop : handleSendMessage}
                    disabled={!message.trim() || !apiConfig.apiKey || isLoadingConfig}
                    size="sm"
                    className={`h-9 w-9 p-0 ${
                      isLoading 
                        ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    {isLoading ? <Square size={15} /> : <ArrowUp size={15} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLoading ? "Stop response" : "Send message"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
