import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { isAuth } = useAuth();

  return (
    <div className="main-layout flex h-screen w-full overflow-hidden">
      {isAuth && (
        <div className="sidebar flex-shrink-0 h-full">
          <AppSidebar />
        </div>
      )}
      <div className="main-content flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
