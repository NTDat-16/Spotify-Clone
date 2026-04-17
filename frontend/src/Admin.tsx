import { Routes, Route, useNavigate } from "react-router-dom";
import SidebarAdmin from "./components/SidebarAdmin";
import Dashboard from "./components/Dashboard";
import SongManagement from "./components/SongManagement";
import UserManagement from "./components/UserManagement";
import ArtistManagement from "./components/ArtistManagement";
import Album from "./components/Album";

export default function Admin() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/login");
    };

    return (
        <div className="flex h-screen w-full bg-[#121212] text-white overflow-hidden">
            <SidebarAdmin onLogout={handleLogout} />
            <div className="flex-1 overflow-y-auto p-8">
                <Routes>
                    <Route path="/" element={<Dashboard />} /> {/* Route mặc định của /admin/ */}
                    <Route path="/songs" element={<SongManagement />} />
                    <Route path="/album" element={<Album/>} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/artists" element={<ArtistManagement />} />
                </Routes>
            </div>
        </div>
    );
}