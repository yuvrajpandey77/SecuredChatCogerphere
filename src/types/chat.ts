
export type Role = "assistant" | "user" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyConfig {
  apiKey: string;
  model: string;
}
