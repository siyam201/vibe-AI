import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  actions?: AIAction[];
}

export interface AIAction {
  type: 'file_create' | 'file_edit' | 'file_delete' | 'install_package' | 'fix_error';
  path?: string;
  content?: string;
  package?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const parseActions = (content: string): AIAction[] => {
    const actions: AIAction[] = [];
    const fileCreateRegex = /<<<FILE_CREATE:\{[^>]+\}>>>/g;
    const fileEditRegex = /<<<FILE_EDIT:\{[^>]+\}>>>/g;
    const fileDeleteRegex = /<<<FILE_DELETE:\{[^>]+\}>>>/g;

    const createMatches = content.match(fileCreateRegex) || [];
    const editMatches = content.match(fileEditRegex) || [];
    const deleteMatches = content.match(fileDeleteRegex) || [];

    createMatches.forEach(match => {
      try {
        const json = match.replace('<<<FILE_CREATE:', '').replace('>>>', '');
        const data = JSON.parse(json);
        actions.push({ type: 'file_create', path: data.path, content: data.content, status: 'complete' });
      } catch {}
    });

    editMatches.forEach(match => {
      try {
        const json = match.replace('<<<FILE_EDIT:', '').replace('>>>', '');
        const data = JSON.parse(json);
        actions.push({ type: 'file_edit', path: data.path, content: data.content, status: 'complete' });
      } catch {}
    });

    deleteMatches.forEach(match => {
      try {
        const json = match.replace('<<<FILE_DELETE:', '').replace('>>>', '');
        const data = JSON.parse(json);
        actions.push({ type: 'file_delete', path: data.path, status: 'complete' });
      } catch {}
    });

    return actions;
  };

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'complete',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentAction('Thinking...');

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();

    // Add empty assistant message
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'streaming',
    }]);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(response.status === 429 ? 'Rate limit exceeded' : 'AI service error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response body');

      setCurrentAction('Generating code...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              
              // Update action based on content
              if (assistantContent.includes('FILE_CREATE')) {
                setCurrentAction('Creating files...');
              } else if (assistantContent.includes('FILE_EDIT')) {
                setCurrentAction('Editing files...');
              }

              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch {}
        }
      }

      // Parse actions from final content
      const actions = parseActions(assistantContent);

      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, content: assistantContent, status: 'complete', actions }
          : m
      ));

    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, content: 'Sorry, there was an error. Please try again.', status: 'error' }
          : m
      ));
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  }, [messages]);

  const explainCode = useCallback(async (code: string) => {
    await sendMessage(`Explain this code in simple terms:\n\n\`\`\`\n${code}\n\`\`\``);
  }, [sendMessage]);

  const fixCode = useCallback(async (code: string, error: string) => {
    await sendMessage(`Fix this code that has an error:\n\nCode:\n\`\`\`\n${code}\n\`\`\`\n\nError: ${error}`);
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    currentAction,
    sendMessage,
    explainCode,
    fixCode,
    clearMessages,
  };
};
