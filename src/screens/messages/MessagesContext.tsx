import React, { createContext, useContext, useMemo, useState } from 'react';
import { CustomerSegment, CustomerTag } from '../../types';
import { Message } from '../../types';
import { countUnreadSenders, INITIAL_MESSAGES } from './messagesData';

interface MessagesContextValue {
  messages: Message[];
  unreadSenderCount: number;
  getThreadById: (threadId: number) => Message | undefined;
  markThreadRead: (threadId: number) => void;
  setThreadSegment: (threadId: number, segment?: CustomerSegment) => void;
  toggleThreadTag: (threadId: number, tag: CustomerTag) => void;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const markThreadRead = (threadId: number) => {
    setMessages(prev =>
      prev.map(item => (item.id === threadId ? { ...item, unread: 0 } : item))
    );
  };

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
    }),
    [messages]
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
