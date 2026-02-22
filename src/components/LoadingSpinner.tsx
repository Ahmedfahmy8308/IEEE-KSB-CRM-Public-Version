// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import Image from 'next/image';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-24 h-24 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>

          {/* Spinning ring */}
          <div className="relative w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin">
            {/* Inner accent ring */}
            <div className="absolute inset-2 border-2 border-blue-100 border-b-blue-400 rounded-full animate-spin-reverse"></div>
          </div>

          {/* IEEE Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <Image
                src="/Logo/Logo2.png"
                alt="IEEE KSB"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-gray-800 text-xl font-bold">Loading</p>
          <div className="flex justify-center gap-1">
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></span>
          </div>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
