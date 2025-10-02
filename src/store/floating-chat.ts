import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  image?: string;
}

interface FloatingChatStore {
  activeChats: Map<string, User>;
  addChat: (userId: string, user: User) => void;
  removeChat: (userId: string) => void;
  clearChats: () => void;
}

export const useFloatingChatStore = create<FloatingChatStore>((set) => ({
  activeChats: new Map(),
  addChat: (userId, user) => 
    set((state) => ({
      activeChats: new Map(state.activeChats).set(userId, user)
    })),
  removeChat: (userId) =>
    set((state) => {
      const newChats = new Map(state.activeChats);
      newChats.delete(userId);
      return { activeChats: newChats };
    }),
  clearChats: () => set({ activeChats: new Map() })
}));