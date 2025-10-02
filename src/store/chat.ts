import { create } from 'zustand';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deleteForEveryone?: boolean;
  sender?: {
    name: string | null;
    image: string | null;
    username: string;
  };
}

interface ChatStore {
  messages: Message[];
  unreadCount: number;
  addMessage: (message: Message) => void;
  markAsRead: (messageId: string) => void;
  setMessages: (messages: Message[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  unreadCount: 0,
  addMessage: (message) => 
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: message.read ? state.unreadCount : state.unreadCount + 1,
    })),
  markAsRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ),
      unreadCount: state.unreadCount - 1,
    })),
  setMessages: (messages) =>
    set(() => ({
      messages,
      unreadCount: messages.filter((msg) => !msg.read).length,
    })),
}));