// Copyright (c) 2026 IEEE KSB & Ahmed Fahmy
// Developed by UFUQ Tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white/70 backdrop-blur-md border-t border-slate-200/80 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          {/* Organization & Copyright */}
          <div className="flex items-center gap-2 tracking-tight">
            <span className="font-semibold text-slate-700">IEEE KSB CRM</span>
            <span className="text-slate-300">•</span>
            <span>© {currentYear} IEEE Kafr El-Sheikh Student Branch</span>
          </div>

          {/* Engineering & Attribution */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Engineered by</span>
            <a
              href="https://ahmed-fahmy.engineer"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Ahmed Fahmy
            </a>
            <span className="text-slate-300">at</span>
            <a
              href="https://ufuq-tech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <span>UFUQ Tech</span>
              <svg
                className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
