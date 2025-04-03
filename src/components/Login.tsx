import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Logo from "./ui/logo";

const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!name.trim() || !email.trim()) {
        toast({
          title: "Invalid input",
          description: "Please provide both name and email",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create a simple user profile
      const userProfile = {
        id: Date.now().toString(), // Simple unique ID
        name,
        email,
        picture: "", // No picture without Google auth
      };
      
      // Log the user in with the profile data
      login(userProfile);
      
      console.log("User logged in successfully", userProfile);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "There was a problem logging in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-background/80 from-purple-50 to-pink-50">
      <div className="text-center space-y-4">
        <div  className="w-32 h-32 py-2  mx-auto">
           
          <Logo />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Cogerphere</h1>
        <p className="text-muted-foreground">Log in to start chatting with your assistant</p>
      </div>
      
      <div className="w-full max-w-sm space-y-4 p-6 bg-card shadow-md rounded-lg">
        <h2 className="text-xl font-medium text-center">Welcome!</h2>
        <p className="text-sm text-muted-foreground text-center">
          Enter your details to continue
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
