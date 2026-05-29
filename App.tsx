import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Chat from './pages/Chat';
import Explore from './pages/JobsFeed'; // Keep filename but rename component internally or use alias
import JobDetails from './pages/JobDetails';
import Notifications from './pages/Notifications';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-[100dvh] bg-[#121212] text-white selection:bg-[#8A2BE2] selection:text-white flex flex-col">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/feed" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/jobs" element={<Navigate to="/explore" replace />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
