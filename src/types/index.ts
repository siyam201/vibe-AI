// Re-export database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

// Common application types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  files: Record<string, unknown>;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  operations?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}
