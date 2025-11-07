'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelOrderDialog({ isOpen, onClose, onConfirm, isLoading = false }: CancelOrderDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">ยกเลิกคำสั่งซื้อ</h2>
              <p className="text-sm text-muted-foreground">คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              การยกเลิกคำสั่งซื้อจะไม่สามารถย้อนกลับได้ และอาจส่งผลต่อคะแนนชื่อเสียงของคุณ
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>กำลังยกเลิก...</span>
                </>
              ) : (
                'ยืนยันยกเลิก'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

