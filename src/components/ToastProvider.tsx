// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { ReactNode } from 'react';
import { Toaster, toast } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options
          duration: 5000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '500px',
          },
          // Success
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #86efac',
            },
          },
          // Error
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
            },
          },
          // Loading
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
            style: {
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #93c5fd',
            },
          },
        }}
      />
    </>
  );
}

// Hook to use toast notifications
export function useToast() {
  return {
    showToast: (message: string, type: ToastType = 'info') => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast(message, {
            icon: '⚠️',
            style: {
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fcd34d',
            },
          });
          break;
        case 'info':
        default:
          toast(message, {
            icon: 'ℹ️',
            style: {
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #93c5fd',
            },
          });
      }
    },
  };
}
