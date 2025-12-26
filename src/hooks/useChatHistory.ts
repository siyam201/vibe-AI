import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  operations?: any[];
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  project_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  lastMessage?: string;
  messageCount?: number;
}

export const useChatHistory = (projectId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithPreview = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: msgData } = await supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            lastMessage: msgData?.[0]?.content?.substring(0, 50) || '',
            messageCount: count || 0,
          };
        })
      );

      setConversations(conversationsWithPreview);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform database messages to include proper operations typing
      const transformedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        operations: msg.operations as any[] || [],
      }));

      setMessages(transformedMessages);
      return transformedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (title?: string): Promise<ChatConversation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          title: title || 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;

      const newConv = data as ChatConversation;
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      return newConv;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, projectId]);

  // Add message to conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    operations?: any[]
  ): Promise<ChatMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          operations: operations || [],
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage = {
        ...data,
        role: data.role as 'user' | 'assistant',
        operations: data.operations as any[] || [],
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversation title if first user message
      const existingMessages = messages.filter(m => m.role === 'user');
      if (role === 'user' && existingMessages.length === 0) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('chat_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, title } : c
        ));
      } else {
        // Just update the timestamp
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [messages]);

  // Update message content (for streaming)
  const updateMessage = useCallback(async (
    messageId: string,
    content: string,
    operations?: any[]
  ) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ content, operations: operations || [] })
        .eq('id', messageId);

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content, operations: operations || m.operations } : m
      ));
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }, []);

  // Load conversation
  const loadConversation = useCallback(async (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [currentConversation]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    createConversation,
    addMessage,
    updateMessage,
    loadConversation,
    deleteConversation,
    clearCurrentConversation,
    setMessages,
  };
};