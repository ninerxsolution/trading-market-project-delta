'use client';

import { AuthProvider } from '@/lib/contexts/auth-context';
import { ChatProvider } from '@/lib/contexts/chat-context';
import { DataProvider } from '@/lib/contexts/data-context';
import { OrderProvider } from '@/lib/contexts/order-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <OrderProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </OrderProvider>
      </DataProvider>
    </AuthProvider>
  );
}

