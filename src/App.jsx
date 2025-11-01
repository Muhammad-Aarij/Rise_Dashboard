import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./screens/Home/Home";
import UsersTable from "./screens/Home/UsersTable";
import ChatScreen from "./screens/Home/Chat";
import NotificationAlert from "./screens/Home/NotificationAlert";
import NewsletterSender from "./screens/Home/NewsletterSender";
import PdfLibraryManager from "./screens/Home/PdfLibraryManager";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BlogPage from "./screens/Home/Blog";
import AudioManager from "./screens/Home/AudioManager";
import AppointmentRequests from "./screens/Home/AppointmentReq";
import { LoginPage } from "./screens/Home/Login";
import { AuthProvider } from "./contexts/AuthContext";
import SupportRequests from "./screens/Home/SupportRequests";

function App() {
  const queryClient = new QueryClient();
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            {/* Public route - Login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes - Main Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/users" replace />} />
              <Route path="users" element={<UsersTable />} />
              <Route path="blogs" element={<BlogPage />} />
              <Route path="chat" element={<ChatScreen />} />
              <Route path="alert" element={<NotificationAlert />} />
              <Route path="newsletter" element={<NewsletterSender />} />
              <Route path="pdfView" element={<PdfLibraryManager />} />
              <Route path="audios" element={<AudioManager />} />
              <Route path="appointment" element={<AppointmentRequests />} />
              <Route path="support" element={<SupportRequests />} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
