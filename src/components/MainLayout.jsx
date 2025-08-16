import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { isAuth } = useAuth();

  return (
    <div className="main-layout">
      {isAuth && <AppSidebar />}
      <div className={`main-content ${isAuth ? 'with-sidebar' : 'no-sidebar'}`}>
        <Outlet />
      </div>
    </div>
  );
}
