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
} from "react-router-dom";
import { Search, UserIcon} from "lucide-react";
import Sidebar from "./components/Sidebar";
import MusicPlayer from "./components/MusicPlayer";
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
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#121212] text-white overflow-hidden">
      <Sidebar isLoggedIn={isLoggedIn} user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-[#181818] border-b border-[#282828]">
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Bạn muốn nghe gì?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-[#282828] text-white rounded-full outline-none placeholder-gray-400 focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                {isLoggedIn && user ? (
                  user.username.charAt(0).toUpperCase()
                ) : (
                  <UserIcon size={20} />
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
        </header>
        <main className="flex-1 bg-[#121212] overflow-y-auto p-0">
          {children}
        </main>
        <MusicPlayer />
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
                  <Route
                    path="/loved"
                    element={<LovedSongs setCurrentSong={undefined} />}
                  />
                  <Route path="/chat" element={<Chat />} />
                  <Route
                    path="/search"
                    element={
                      <SearchResults
                        query={
                          new URLSearchParams(window.location.search).get(
                            "query"
                          ) || ""
                        }
                      />
                    }
                  />
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