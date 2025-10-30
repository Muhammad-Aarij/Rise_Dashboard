import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import profile from "../assets/profile.png";
import alert from "../assets/alert.png";
import audio from "../assets/auto.png";
import book from "../assets/book.png";
import letter from "../assets/letter.png";
import home from "../assets/home.png";
import chat from "../assets/chat.png";

/**
 * Utility: hide scrollbars cross-browser
 * Apply className="no-scrollbar" to any scroll container.
 */
const NoScrollbarStyle = () => (
  <style>{`
    .no-scrollbar {
      -ms-overflow-style: none; /* IE/Edge */
      scrollbar-width: none;    /* Firefox */
    }
    .no-scrollbar::-webkit-scrollbar { display: none; } /* Chrome/Safari */
  `}</style>
);

const Sidebar = () => {
  const { logout, user } = useAuth();

  const sections = useMemo(
    () => [
      {
        title: "Analytics",
        items: [
          // { href: "/dashboard", icon: home, text: "Home" },
          { href: "/users", icon: profile, text: "Users" },
          { href: "/blogs", icon: book, text: "Blogs" },
        ],
      },
      {
        title: "Community",
        items: [
          // { href: "/posts", icon: letter, text: "Posts" },
          { href: "/chat", icon: chat, text: "Chat" },
          { href: "/alert", icon: alert, text: "Notification Alerts" },
          { href: "/newsletter", icon: letter, text: "Newsletters" },
          { href: "/appointment", icon: letter, text: "Appointment Requests" },
          { href: "/support", icon: letter, text: "Support" },
          // { href: "/subscribers", icon: letter, text: "Subscribers" },
        ],
      },
      {
        title: "Customization",
        items: [
          { href: "/audios", icon: audio, text: "Upload Audio File" },
          { href: "/pdfView", icon: book, text: "Upload Book" },
        ],
      },
    ],
    []
  );

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r dark:bg-gray-900 dark:border-gray-800">
      <NoScrollbarStyle />

      {/* Top brand */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <a href="/" aria-label="Home" className="flex items-center gap-2">
          {/* <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 shadow-lg" /> */}
          <h1 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">
            Rise Dashboard
          </h1>
        </a>
      </div>

      {/* User card */}
      {user && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-tr from-purple-900 to-blue-500 shadow-lg dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 p-3">
            {/* <img
              src={user.avatar || profile}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
            /> */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-100 truncate">
                {user.email || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav (scrollable, scrollbar hidden) */}
      <div className="flex-1 mt-3 overflow-y-auto no-scrollbar px-3">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <label className="px-2 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {section.title}
              </label>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavItem href={item.href} icon={item.icon} text={item.text} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-white bg-gradient-to-r from-rose-500 to-red-500 rounded-lg shadow-md hover:opacity-95 active:opacity-90 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ href, icon, text }) => {
  // Highlight active based on current pathname
  const pathname =
    typeof window !== "undefined" && window.location ? window.location.pathname : "";
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <a
      href={href}
      aria-label={text}
      className={[
        "group flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors",
        isActive
          ? "bg-gray-100 border-gray-200 text-gray-900 dark:bg-gray-800/80 dark:text-white dark:border-gray-700"
          : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
      ].join(" ")}
    >
      <img src={icon} alt="" className="w-5 h-5 opacity-90 group-hover:opacity-100" />
      <span className="text-sm font-medium truncate">{text}</span>
      {isActive && (
        <span className="ml-auto h-2 w-2 rounded-full bg-blue-500/90 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
      )}
    </a>
  );
};

// Optional: keep for future SVG map usage
const getIcon = (name) => {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M18 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  };
  return (
    icons[name] || (
      <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
      </svg>
    )
  );
};

export default Sidebar;
