'use client';

import { AuthProvider } from '@/lib/contexts/auth-context';
import { ChatProvider } from '@/lib/contexts/chat-context';
import { DataProvider } from '@/lib/contexts/data-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </DataProvider>
    </AuthProvider>
  );
}

