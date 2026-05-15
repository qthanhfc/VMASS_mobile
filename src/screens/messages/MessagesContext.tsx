import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CustomerSegment, CustomerTag } from '../../types';
import { Message } from '../../types';
import { countUnreadSenders, INITIAL_MESSAGES } from './messagesData';
import { useRealtime } from '../../realtime';
import { listMessages, markMessageRead } from '../../services';

interface MessagesContextValue {
  messages: Message[];
  unreadSenderCount: number;
  getThreadById: (threadId: number) => Message | undefined;
  markThreadRead: (threadId: number) => void;
  setThreadSegment: (threadId: number, segment?: CustomerSegment) => void;
  toggleThreadTag: (threadId: number, tag: CustomerTag) => void;
  refreshMessages: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const { subscribe } = useRealtime();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Attempt to fetch messages from the API; keep current data on failure. */
  const refreshMessages = useCallback(async () => {
    try {
      const apiMessages = await listMessages();
      if (Array.isArray(apiMessages) && apiMessages.length > 0) {
        setMessages(apiMessages);
      }
    } catch {
      // API not available — keep current (demo/cached) data silently.
    }
  }, []);

  /** Initial fetch on mount. */
  useEffect(() => {
    void refreshMessages();
  }, [refreshMessages]);

  /** Subscribe to realtime events for the 'messages' scope. */
  useEffect(() => {
    return subscribe((event) => {
      if (event.scope !== 'messages') return;

      // Debounce rapid events (e.g. multiple messages arriving at once).
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void refreshMessages();
      }, 400);
    });
  }, [subscribe, refreshMessages]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const markThreadRead = useCallback((threadId: number) => {
    setMessages(prev =>
      prev.map(item => (item.id === threadId ? { ...item, unread: 0 } : item))
    );
    // Notify the backend (fire-and-forget).
    void markMessageRead(threadId).catch(() => { /* silent */ });
  }, []);

  const setThreadSegment = (threadId: number, segment?: CustomerSegment) => {
    setMessages(prev =>
      prev.map(item => (item.id === threadId ? { ...item, customerSegment: segment } : item))
    );
  };

  const toggleThreadTag = (threadId: number, tag: CustomerTag) => {
    setMessages(prev =>
      prev.map(item => {
        if (item.id !== threadId) return item;
        const current = item.customerTags ?? [];
        const exists = current.includes(tag);
        return {
          ...item,
          customerTags: exists ? current.filter(t => t !== tag) : [...current, tag],
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      messages,
      unreadSenderCount: countUnreadSenders(messages),
      getThreadById: (threadId: number) => messages.find(item => item.id === threadId),
      markThreadRead,
      setThreadSegment,
      toggleThreadTag,
      refreshMessages,
    }),
    [messages, markThreadRead, refreshMessages]
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
