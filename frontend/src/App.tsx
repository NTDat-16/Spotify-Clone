import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MusicPlayer from "./components/MusicPlayer";
import Home from "./pages/Home";
import Playlist from "./pages/Playlist";
import LovedSongs from "./pages/LovedSongs";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import SleepTimer from "./components/SleepTimer";
import { UserIcon } from "lucide-react";
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [currentSong, setCurrentSong] = useState({
    title: "No song playing",
    artist: "",
    image_url:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
  });
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
  };
  return (
    <Router>
      <div className="flex h-screen w-full bg-white text-gray-800 overflow-hidden">
        {isLoggedIn ? (
          <>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="h-16 flex items-center justify-end px-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowSleepTimer(!showSleepTimer)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sleep Timer
                  </button>
                  <div className="flex items-center gap-2">
                    <UserIcon size={18} className="text-gray-600" />
                    <span className="text-sm font-medium">User</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-sm bg-gray-200 rounded-full hover:bg-gray-300"
                  >
                    Logout
                  </button>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-6">
                <Routes>
                  <Route
                    path="/"
                    element={<Home setCurrentSong={setCurrentSong} />}
                  />
                  <Route
                    path="/playlist/:id"
                    element={<Playlist setCurrentSong={setCurrentSong} />}
                  />
                  <Route
                    path="/loved"
                    element={<LovedSongs setCurrentSong={setCurrentSong} />}
                  />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              <MusicPlayer currentSong={currentSong} />
            </div>
            {showSleepTimer && (
              <SleepTimer onClose={() => setShowSleepTimer(false)} />
            )}
          </>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}
