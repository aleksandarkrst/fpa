"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    section: "Planning",
    items: [
      {
        label: "Revenue",
        href: "/planning",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Administration",
    items: [
      {
        label: "Master Data",
        href: "/admin",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11h6M9 15h4" />
          </svg>
        ),
      },
      {
        label: "Period Settings",
        href: "/admin/periods",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        label: "Actual Import",
        href: "/admin/actuals",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo / app name */}
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-white font-semibold text-sm tracking-wide">FP&amp;A</span>
        <p className="text-gray-500 text-xs mt-0.5">Financial Planning &amp; Analysis</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <p className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ label, href, icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors
                        ${active
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                    >
                      {icon}
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
