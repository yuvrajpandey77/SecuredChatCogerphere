
import React from "react";
import { useChat } from "@/context/ChatContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ModelSelectionFormValues {
  apiKey: string;
}

interface ModelSelectionProps {
  onComplete: () => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ onComplete }) => {
  const { setApiConfig, apiConfig } = useChat();
  const { toast } = useToast();
  
  // Don't render if API key is already set
  if (apiConfig.apiKey) {
    return null;
  }
  
  const form = useForm<ModelSelectionFormValues>({
    defaultValues: {
      apiKey: "",
    },
  });

  const onSubmit = (data: ModelSelectionFormValues) => {
    if (!data.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key",
        variant: "destructive",
      });
      return;
    }
    
    setApiConfig({
      apiKey: data.apiKey,
      model: "mistralai/mistral-small-3.2-24b-instruct:free", // Default to Mistral
    });
    
    toast({
      title: "Configuration Complete",
      description: "Your chat is ready to use! You can change models in settings.",
    });
    
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Setup Your Chat</h2>
            <p className="text-muted-foreground">
              Enter your OpenRouter API key to start chatting with AI models
            </p>
          </div>

          <div className="bg-amber-50 border-amber-200 border rounded-md p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-amber-800">
                  You'll need an OpenRouter API key to use this app. 
                </p>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get one here
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                OpenRouter API Key
              </label>
              <Input
                id="apiKey"
                placeholder="sk-or-..."
                type="password"
                {...form.register('apiKey')}
                required
              />
            </div>

            <Button type="submit" className="w-full">Start Chatting</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
