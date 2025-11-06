'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Home, PlusCircle, User, LogIn, LogOut, ShoppingBag, Inbox, Shield, Bug } from 'lucide-react';
import { cn, getDisplayName } from '@/lib/utils';
import { ReportSystemModal } from '@/components/report-system-modal';

export function Navbar() {
  const { user, logout } = useAuth();
  const [showReportSystemModal, setShowReportSystemModal] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          <ShoppingBag className="h-7 w-7 text-purple-500" />
          <span>Roblox Trade</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link
            href="/post"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sell Item</span>
          </Link>

          <Link
            href="/inbox"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
          </Link>

          {user && (
            <button
              onClick={() => setShowReportSystemModal(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              title="รายงานระบบ / แจ้งบัค"
            >
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">รายงานระบบ</span>
            </button>
          )}

          {user ? (
            <>
              {/* Admin menus */}
              {user.role === 'SUPER_ADMIN' && (
                <>
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                  <Link
                    href="/admin/items"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Manage Items</span>
                  </Link>
                </>
              )}

              <Link
                href={`/profile/${user.username}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{getDisplayName(user)}</span>
              </Link>
              <button
                onClick={logout}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  "hover:bg-destructive hover:text-destructive-foreground"
                )}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
    {showReportSystemModal && (
      <ReportSystemModal
        onClose={() => setShowReportSystemModal(false)}
      />
    )}
    </>
  );
}

