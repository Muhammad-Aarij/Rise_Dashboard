import React from "react";
import profile from '../assets/profile.png'
import alert from '../assets/alert.png'
import audio from '../assets/auto.png'
import book from '../assets/book.png'
import letter from '../assets/letter.png'
import home from '../assets/home.png'
import chat from '../assets/chat.png'


const Sidebar = () => {
  return (
    <aside className="flex flex-col w-64 h-screen px-5 py-8 overflow-y-auto bg-white border-r dark:bg-gray-900 dark:border-gray-700">
      {/* Logo */}
      <a href="/" aria-label="Home">
        <h1 className="text-white font-bold text-xl">Rise Dashboard </h1>
      </a>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav className="-mx-3 space-y-6">

          {/* Analytics Section */}
          <div className="space-y-3">
            <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">Analytics</label>
            {/* <NavItem href="/dashboard" icon={home} text="Home" /> */}
            <NavItem href="/users" icon={profile} text="Users" />
            <NavItem href="/blogs" icon={book} text="Blogs" />
          </div>

          {/* Content Section */}
          <div className="space-y-3">
            <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">Community</label>
            {/* <NavItem href="/posts" icon={letter} text="Posts" /> */}
            <NavItem href="/chat" icon={chat} text="Chat" />
            <NavItem href="/alert" icon={alert} text="Nofitication Alert" />
            <NavItem href="/newsletter" icon={chat} text="News Letters" />
            <NavItem href="/appointment" icon={letter} text="Appointment Requests" />
            {/* <NavItem href="/subscribers" icon={letter} text="Subscribers" /> */}
          </div>

          {/* Customization Section */}
          <div className="space-y-3">
            <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">Customization</label>
            <NavItem href="/audios" icon={audio} text="Upload Audio file" />
            <NavItem href="/pdfView" icon={book} text="Upload Book" />
          </div>
        </nav>
      </div>
    </aside>
  );
};

const NavItem = ({ href, icon, text }) => {
  return (
    <a className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700" href={href} aria-label={text}>
      <img src={icon} className="w-5 h-5"></img>
      <span className="mx-2 text-sm font-medium">{text}</span>
    </a>
  );
};

// Function to return SVG Icons
const getIcon = (name) => {
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M18 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>,
    performance: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 16.5h2.25M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
    guides: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75" /></svg>,
    hotspots: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12l3-3m-3 3l-3-3m-12 3l3 3m-3-3l-3 3" /></svg>,
    checklists: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75" /></svg>,
    themes: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402" /></svg>,
    settings: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94" /></svg>,
  };
  return icons[name] || <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><circle cx="12" cy="12" r="10" /></svg>; // Default placeholder icon
};

export default Sidebar;
