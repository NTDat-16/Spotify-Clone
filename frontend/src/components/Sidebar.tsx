// frontend/src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { API_ORIGIN } from "../config/api";
import { NavLink, useNavigate } from "react-router-dom";
import { ListMusicIcon, PlusCircleIcon, Trash2Icon, Crown, X } from "lucide-react";

interface Playlist {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  cover_image: string | null;
  description: string | null;
  status: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface SidebarProps {
  isLoggedIn: boolean;
  user: User | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isLoggedIn, user, isOpen = false, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isLoggedIn || !user) {
        setPlaylists([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `${API_ORIGIN}/api/playlists/?user_id=${user.id}`
        );
        if (!response.ok) throw new Error("Không thể tải danh sách playlist.");
        const data = await response.json();
        setPlaylists(data);
      } catch (err) {
        setError("Đã xảy ra lỗi khi lấy danh sách playlist.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [isLoggedIn, user]);

  const handleAddPlaylistClick = () => {
    if (!isLoggedIn || !user) {
      alert("Vui lòng đăng nhập để tạo playlist!");
      navigate("/login");
      return;
    }
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPlaylistName.trim() === "") {
      alert("Tên danh sách phát không được để trống!");
      return;
    }
    if (!isLoggedIn || !user) return;

    try {
      const response = await fetch(`${API_ORIGIN}/api/playlists/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName.trim(), user_id: user.id }),
      });
      if (!response.ok) throw new Error("Không thể tạo playlist.");
      const data = await response.json();
      setPlaylists([...playlists, data]);
      setNewPlaylistName("");
      setIsFormVisible(false);
    } catch (err) {
      setError("Đã xảy ra lỗi khi tạo playlist.");
    }
  };

  const handleCancel = () => {
    setNewPlaylistName("");
    setIsFormVisible(false);
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa playlist này không?")) return;
    try {
      const response = await fetch(
        `${API_ORIGIN}/api/playlists/delete/${playlistId}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Không thể xóa playlist.");
      setPlaylists(playlists.filter((playlist) => playlist.id !== playlistId));
    } catch (err) {
      setError("Đã xảy ra lỗi khi xóa playlist.");
    }
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#121212] border-r border-[#282828] flex flex-col text-gray-300 shadow-2xl transition-transform duration-300 ease-in-out md:static md:w-64 md:h-full md:shadow-none md:translate-x-0 flex-shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 sm:p-6 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span className="text-[#1DB954]">Spotify</span>
          </h1>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282828] transition"
            title="Đóng menu"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-[#1db954] text-black font-bold"
                      : "hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <span>Trang chủ</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/all_songs"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-[#1db954] text-black font-bold"
                      : "hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <span>Tất cả bài hát</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/loved"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-[#1db954] text-black font-bold"
                      : "hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <span>Bài hát yêu thích</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/chat"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-[#1db954] text-black font-bold"
                      : "hover:bg-gray-800 hover:text-white text-gray-300"
                  }`
                }
              >
                <span>Chat & AI DJ</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#1DB954] text-black">
                  AI
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/premium"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold shadow-md"
                      : "hover:bg-gray-800 text-amber-300 hover:text-white"
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Crown size={17} className="text-yellow-400" />
                  <span>Nâng cấp Premium</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-400 text-black uppercase tracking-wider">
                  VIP
                </span>
              </NavLink>
            </li>
          </ul>
          <div className="mt-8">
            <div className="flex items-center justify-between px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Danh sách phát
              </h3>
              <button
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition"
                onClick={handleAddPlaylistClick}
                title="Tạo playlist mới"
              >
                <PlusCircleIcon size={16} />
              </button>
            </div>
            {isFormVisible && (
              <div className="px-4 py-2">
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Nhập tên danh sách phát"
                    className="w-full px-3 py-2 text-sm bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm text-black bg-[#1db954] rounded-lg hover:bg-green-500 font-medium"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-3 py-1 text-sm text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
            {loading && <p className="px-4 text-sm text-gray-400">Đang tải...</p>}
            {error && <p className="px-4 text-sm text-red-500">{error}</p>}
            <ul className="mt-2 space-y-1 pb-16 md:pb-6">
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="flex items-center justify-between"
                  >
                    <NavLink
                      to={`/playlist/${playlist.id}`}
                      onClick={() => onClose?.()}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm rounded-lg transition flex-1 ${
                          isActive
                            ? "bg-[#1db954] text-black font-semibold"
                            : "hover:bg-gray-800 hover:text-white"
                        }`
                      }
                    >
                      <ListMusicIcon size={16} className="mr-3 flex-shrink-0" />
                      <span className="truncate">{playlist.name}</span>
                    </NavLink>
                    <button
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="text-gray-400 hover:text-red-500 p-2 transition"
                      title="Xóa playlist"
                    >
                      <Trash2Icon size={16} />
                    </button>
                  </li>
                ))
              ) : (
                <p className="px-4 text-sm text-gray-400">
                  {isLoggedIn
                    ? "Không có playlist nào."
                    : "Vui lòng đăng nhập để xem playlist."}
                </p>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;