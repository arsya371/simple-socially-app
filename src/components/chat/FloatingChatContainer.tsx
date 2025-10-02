'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FloatingChat } from './FloatingChat';
import { useFloatingChatStore } from '@/store/floating-chat';

export function FloatingChatContainer() {
  const { activeChats, removeChat } = useFloatingChatStore();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById('floating-chat-container'));
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="fixed bottom-0 right-0 flex items-end gap-4 p-4 max-w-full">
      {Array.from(activeChats.entries()).map(([userId, user]) => (
        <FloatingChat
          key={userId}
          receiverId={userId}
          receiverUsername={user.username}
          receiverImage={user.image}
          onClose={() => removeChat(userId)}
        />
      ))}
    </div>,
    container
  );
}