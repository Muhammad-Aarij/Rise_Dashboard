import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Home from "./screens/Home/home";
import UsersTable from "./screens/Home/UsersTable";
import ChatScreen from "./screens/Home/Chat";
import NotificationAlert from "./screens/Home/NotificationAlert";
import NewsletterSender from "./screens/Home/NewsletterSender";
import PdfLibraryManager from "./screens/Home/PdfLibraryManager";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BlogPage from "./screens/Home/Blog";
import AudioManager from "./screens/Home/AudioManager";
import AppointmentRequests from "./screens/Home/AppointmentReq";


function App() {
  const queryClient = new QueryClient();
  return (
    <>
      {/* <h1 className="text-4xl text-red-500">Aarij</h1> */}
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* <Route index element={<Home />} /> */}
            <Route index element={<UsersTable />} /> {/* Changed from index to path */}
            <Route path="users" element={<UsersTable />} /> {/* Changed from index to path */}
            <Route path="blogs" element={<BlogPage />} /> {/* Changed from index to path */}
            <Route path="chat" element={<ChatScreen />} /> {/* Changed from index to path */}
            <Route path="alert" element={<NotificationAlert />} /> {/* Changed from index to path */}
            <Route path="newsletter" element={<NewsletterSender />} /> {/* Changed from index to path */}
            <Route path="pdfView" element={<PdfLibraryManager />} /> {/* Changed from index to path */}
            <Route path="audios" element={<AudioManager />} /> {/* Changed from index to path */}
            <Route path="appointment" element={<AppointmentRequests />} /> {/* Changed from index to path */}
            {/* Add more routes here */}
          </Route>
        </Routes>
      </QueryClientProvider>
    </>
  );
}

export default App;
