
import React from "react";
import { useChat } from "@/context/ChatContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ModelSelectionFormValues {
  model: string;
  apiKey: string;
}

interface ModelSelectionProps {
  onComplete: () => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ onComplete }) => {
  const { setApiConfig } = useChat();
  const { toast } = useToast();
  
  const form = useForm<ModelSelectionFormValues>({
    defaultValues: {
      model: "openai/gpt-4o-mini",
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
      model: data.model,
    });
    
    toast({
      title: "Configuration Complete",
      description: "Your chat is ready to use!",
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
              Select a model and enter your OpenRouter API key to continue
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Model</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-accent">
                        <FormControl>
                          <RadioGroupItem value="openai/gpt-4o-mini" />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal flex justify-between items-center w-full">
                          <div>
                            <div className="font-medium">GPT-4o Mini</div>
                            <div className="text-sm text-muted-foreground">Fast & cost-effective</div>
                          </div>
                          {field.value === "openai/gpt-4o-mini" && <Check className="h-4 w-4 text-primary" />}
                        </FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-accent">
                        <FormControl>
                          <RadioGroupItem value="openai/gpt-4o" />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal flex justify-between items-center w-full">
                          <div>
                            <div className="font-medium">GPT-4o</div>
                            <div className="text-sm text-muted-foreground">More capable, higher cost</div>
                          </div>
                          {field.value === "openai/gpt-4o" && <Check className="h-4 w-4 text-primary" />}
                        </FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-accent">
                        <FormControl>
                          <RadioGroupItem value="anthropic/claude-3-sonnet" />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal flex justify-between items-center w-full">
                          <div>
                            <div className="font-medium">Claude 3 Sonnet</div>
                            <div className="text-sm text-muted-foreground">Balanced performance</div>
                          </div>
                          {field.value === "anthropic/claude-3-sonnet" && <Check className="h-4 w-4 text-primary" />}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenRouter API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="sk-or-..."
                        type="password"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">Start Chatting</Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
