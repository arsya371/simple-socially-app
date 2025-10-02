'use client';

import { FloatingChatContainer } from "@/components/chat/FloatingChatContainer";
import { ChatContainerRoot } from "@/components/chat/ChatContainerRoot";

export function ChatProvider() {
  return (
    <>
      <ChatContainerRoot />
      <FloatingChatContainer />
    </>
  );
}