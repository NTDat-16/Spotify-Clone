// import { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
// } from "react-router-dom";
// import { Search, UserIcon} from "lucide-react";
// import Sidebar from "./components/Sidebar";
// import MusicPlayer from "./components/MusicPlayer";
// import Playlist from "./pages/Playlist";
// import Home from "./components/Assets/HomeForm/Home";
// import AllSongs from "./pages/AllSongs";
// import AdminPage from "./Admin";
// import Chat from "./pages/Chat";
// import SearchResults from "./pages/SearchResults";
// import { AudioProvider } from "./AudioContext";
// import RequireAuth from "./routes/RequireAuth";
// import LoginAdmin from "./pages/LoginAdmin";
// import LoginUser from "./pages/LoginUser";
// import LovedSongs from "./pages/LovedSongs";
// import UserMenu from "./components/UserMenu";
// import UserProfile from "./pages/UserProfile";
// import UserChangePass from "./pages/UserChangePass";
// import ViewAlbum from "./pages/ViewAlbum";
// type MainLayoutProps = {
//   children: React.ReactNode;
//   setSearchQuery: (value: string) => void;
//   searchQuery: string;
//   setShowSleepTimer: React.Dispatch<React.SetStateAction<boolean>>;
//   showSleepTimer: boolean;
//   isLoggedIn: boolean;
//   setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
//   user: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean } | null;
//   setUser: React.Dispatch<
//     React.SetStateAction<{
//       id: number;
//       username: string;
//       email: string;
//       created_at?: string;
//       isPremium?: boolean;
//     } | null>
//   >;
// };

// function MainLayout({
//   children,
//   setSearchQuery,
//   searchQuery,
//   isLoggedIn,
//   setIsLoggedIn,
//   user,
//   setUser,
// }: MainLayoutProps) {
//   const navigate = useNavigate();
//   const [showUserMenu, setShowUserMenu] = useState(false);

//   const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && searchQuery.trim()) {
//       navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
//     }
//   };

//   return (
//     <div className="flex h-screen w-full bg-[#121212] text-white overflow-hidden">
//       <Sidebar isLoggedIn={isLoggedIn} user={user} />
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <header className="h-16 flex items-center justify-between px-6 bg-[#181818] border-b border-[#282828]">
//           <div className="relative w-72">
//             <Search
//               className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//               size={18}
//             />
//             <input
//               type="text"
//               placeholder="Bạn muốn nghe gì?"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               onKeyDown={handleSearch}
//               className="w-full pl-10 pr-4 py-2 bg-[#282828] text-white rounded-full outline-none placeholder-gray-400 focus:ring-2 focus:ring-gray-500"
//             />
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               className="flex items-center gap-2"
//             >
//               <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
//                 {isLoggedIn && user ? (
//                   user.username.charAt(0).toUpperCase()
//                 ) : (
//                   <UserIcon size={20} />
//                 )}
//               </div>
//             </button>
//             {showUserMenu && (
//               <UserMenu
//                 isLoggedIn={isLoggedIn}
//                 user={user}
//                 setIsLoggedIn={setIsLoggedIn}
//                 setUser={setUser}
//                 onClose={() => setShowUserMenu(false)}
//               />
//             )}
//           </div>
//         </header>
//         <main className="flex-1 bg-[#121212] overflow-y-auto p-0">
//           {children}
//         </main>
//         <MusicPlayer />
//       </div>
//     </div>
//   );
// }

// export function App() {
//   const [showSleepTimer, setShowSleepTimer] = useState<boolean>(false);
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
//     !!localStorage.getItem("token")
//   );
//   const [user, setUser] = useState<{
//     id: number;
//     username: string;
//     email: string;
//     created_at?: string;
//     isPremium?: boolean;
//   } | null>(() => {
//     const storedUser = localStorage.getItem("user");
//     return storedUser ? JSON.parse(storedUser) : null;
//   });

//   return (
//     <AudioProvider>
//       <Router>
//         <Routes>
//           <Route
//             path="/admin/*"
//             element={
//               <RequireAuth>
//                 <AdminPage />
//               </RequireAuth>
//             }
//           />
//           <Route
//             path="/login"
//             element={
//               <LoginUser
//                 setIsLoggedIn={setIsLoggedIn}
//                 onLogin={(_email, _password, userData) => {
//                   setUser(userData);
//                   localStorage.setItem("user", JSON.stringify(userData));
//                 }}
//               />
//             }
//           />
//           <Route path="/login/admin" element={<LoginAdmin />} />
//           <Route
//             path="*"
//             element={
//               <MainLayout
//                 setSearchQuery={setSearchQuery}
//                 searchQuery={searchQuery}
//                 setShowSleepTimer={setShowSleepTimer}
//                 showSleepTimer={showSleepTimer}
//                 isLoggedIn={isLoggedIn}
//                 setIsLoggedIn={setIsLoggedIn}
//                 user={user}
//                 setUser={setUser}
//               >
//                 <Routes>
//                   <Route path="/" element={<Home/>} />
//                   <Route path="/playlist/:id" element={<Playlist />} />
//                   <Route path="/all_songs" element={<AllSongs />} />
//                   <Route path="/viewalbum/:id" element={<ViewAlbum />} />
//                   <Route
//                     path="/loved"
//                     element={<LovedSongs setCurrentSong={undefined} />}
//                   />
//                   <Route path="/chat" element={<Chat />} />
//                   <Route
//                     path="/search"
//                     element={
//                       <SearchResults
//                         query={
//                           new URLSearchParams(window.location.search).get(
//                             "query"
//                           ) || ""
//                         }
//                       />
//                     }
//                   />
//                   <Route
//                     path="/profile"
//                     element={
//                       <RequireAuth>
//                         <UserProfile user={user} setUser={setUser} />
//                       </RequireAuth>
//                     }
//                   />
//                   <Route
//                     path="/changepass"
//                     element={
//                       <RequireAuth>
//                         <UserChangePass user={user} setUser={setUser} />
//                       </RequireAuth>
//                     }
//                   />

//                   <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//               </MainLayout>
//             }
//           />
//         </Routes>
//       </Router>
//     </AudioProvider>
//   );
// }

import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  UserIcon,
  Sparkles,
  DownloadCloud,
  Menu,
  Home as HomeIcon,
  Music,
  Heart,
  MessageSquare,
  Crown,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import MusicPlayer from "./components/MusicPlayer";
import YouTubePlayer from "./components/YouTubePlayer";
import Playlist from "./pages/Playlist";
import Home from "./components/Assets/HomeForm/Home";
import AllSongs from "./pages/AllSongs";
import AdminPage from "./Admin";
import Chat from "./pages/Chat";
import SearchResults from "./pages/SearchResults";
import { AudioProvider } from "./AudioContext";
import RequireAuth from "./routes/RequireAuth";
import LoginAdmin from "./pages/LoginAdmin";
import LoginUser from "./pages/LoginUser";
import LovedSongs from "./pages/LovedSongs";
import UserMenu from "./components/UserMenu";
import UserProfile from "./pages/UserProfile";
import UserChangePass from "./pages/UserChangePass";
import ViewAlbum from "./pages/ViewAlbum";
import PremiumSignup from "./pages/PremiumSignup";
import CatalogImportModal from "./components/CatalogImportModal";

type MainLayoutProps = {
  children: React.ReactNode;
  setSearchQuery: (value: string) => void;
  searchQuery: string;
  setShowSleepTimer: React.Dispatch<React.SetStateAction<boolean>>;
  showSleepTimer: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean } | null;
  setUser: React.Dispatch<
    React.SetStateAction<{
      id: number;
      username: string;
      email: string;
      created_at?: string;
      isPremium?: boolean;
    } | null>
  >;
};

function MainLayout({
  children,
  setSearchQuery,
  searchQuery,
  isLoggedIn,
  setIsLoggedIn,
  user,
  setUser,
}: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navItems = [
    { label: "Trang chủ", icon: HomeIcon, path: "/" },
    { label: "Bài hát", icon: Music, path: "/all_songs" },
    { label: "Yêu thích", icon: Heart, path: "/loved" },
    { label: "AI DJ", icon: MessageSquare, path: "/chat" },
    { label: "Premium", icon: Crown, path: "/premium" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#121212] text-white overflow-hidden">
      <Sidebar
        isLoggedIn={isLoggedIn}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-[#181818] border-b border-[#282828] z-20 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-300 hover:text-white rounded-lg hover:bg-[#282828] transition focus:outline-none flex-shrink-0"
              title="Mở menu"
            >
              <Menu size={22} />
            </button>

            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={17}
              />
              <input
                type="text"
                placeholder="Bạn muốn nghe gì?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-9 pr-3 sm:pr-4 py-2 bg-[#282828] text-white text-xs sm:text-sm rounded-full outline-none placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
            <button
              onClick={() => setShowImportModal(true)}
              title="Tự động nạp thêm nhiều bài hát từ Apple Music & Spotify"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold bg-[#282828] text-white hover:bg-[#333] border border-white/10 hover:border-white/20 transition shadow hover:scale-105 active:scale-95"
            >
              <DownloadCloud size={14} className="text-[#1DB954]" />
              <span className="hidden sm:inline">Nạp thêm</span>
            </button>

            {user?.isPremium ? (
              <button
                onClick={() => navigate("/premium")}
                title="Tài khoản Spotify Premium"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow hover:opacity-90 transition"
              >
                <span>★ PREMIUM</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/premium")}
                title="Khám phá các gói Spotify Premium"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:scale-105 active:scale-95 transition shadow"
              >
                <Sparkles size={14} className="text-[#1DB954]" />
                <span className="hidden md:inline">Khám phá Premium</span>
                <span className="md:hidden">Premium</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold shadow">
                  {isLoggedIn && user ? (
                    user.username.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={18} />
                  )}
                </div>
              </button>
              {showUserMenu && (
                <UserMenu
                  isLoggedIn={isLoggedIn}
                  user={user}
                  setIsLoggedIn={setIsLoggedIn}
                  setUser={setUser}
                  onClose={() => setShowUserMenu(false)}
                />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#121212] overflow-y-auto p-0 pb-36 md:pb-24">
          {children}
        </main>

        <YouTubePlayer />
        <MusicPlayer />

        {/* Mobile Bottom Navigation Bar (Spotify Native Feel) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#282828] py-1.5 px-2 flex justify-around items-center select-none shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? "text-[#1DB954]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={19} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
                <span className="text-[10px] font-semibold mt-1 truncate max-w-[64px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <CatalogImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      </div>
    </div>
  );
}


export function App() {
  const [showSleepTimer, setShowSleepTimer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    !!localStorage.getItem("token")
  );
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    created_at?: string;
    isPremium?: boolean;
  } | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <AudioProvider>
      <Router>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              <LoginUser
                setIsLoggedIn={setIsLoggedIn}
                onLogin={(_email, _password, userData) => {
                  setUser(userData);
                  localStorage.setItem("user", JSON.stringify(userData));
                }}
              />
            }
          />
          <Route path="/login/admin" element={<LoginAdmin />} />
          <Route
            path="*"
            element={
              <MainLayout
                setSearchQuery={setSearchQuery}
                searchQuery={searchQuery}
                setShowSleepTimer={setShowSleepTimer}
                showSleepTimer={showSleepTimer}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                user={user}
                setUser={setUser}
              >
                <Routes>
                  <Route path="/" element={<Home/>} />
                  <Route path="/playlist/:id" element={<Playlist />} />
                  <Route path="/all_songs" element={<AllSongs />} />
                  <Route path="/viewalbum/:id" element={<ViewAlbum />} />
                  <Route path="/loved" element={<LovedSongs />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <UserProfile user={user} setUser={setUser} />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/changepass"
                    element={
                      <RequireAuth>
                        <UserChangePass user={user} setUser={setUser} />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/premium"
                    element={
                      <RequireAuth>
                        <PremiumSignup user={user} setUser={setUser} />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/premium/success"
                    element={<div>Thanh toán thành công! Đang chuyển hướng...</div>}
                  />
                  <Route
                    path="/premium/cancel"
                    element={<div>Thanh toán đã bị hủy.</div>}
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </AudioProvider>
  );
}