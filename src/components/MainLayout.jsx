import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <AppSidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
