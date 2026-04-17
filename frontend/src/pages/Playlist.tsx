import { useParams, useNavigate } from "react-router-dom";
import {
  PlayIcon,
  Menu,
  Clock3Icon,
  Trash2Icon,
  PlusCircleIcon,
  CircleEllipsis,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAudio } from "../AudioContext";

type Song = {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string; // Align with useAudio's Song type
  premium: number;
};

interface Playlist {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  cover_image: string | null;
  description: string | null;
  status: number;
  songs: { song: Song }[];
}

const Playlist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handlePlaySong, setSongList } = useAudio();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for user premium status (replace with actual logic)
  const isPremiumUser = false; // Replace with auth context or API call

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/playlists/${id}/`);
        if (!response.ok) throw new Error("Không thể tải playlist.");
        const data = await response.json();
        console.log("Playlist API response:", data); // Debug: Log API response
        const mappedSongs = data.songs.map((item: { song: any }) => ({
          id: item.song.id,
          name: item.song.name,
          artist: item.song.artist_name,
          album: item.song.album_name || null, // Use album_name
          duration: item.song.duration,
          song_url: item.song.song_url,
          image_url: item.song.album_img
            ? `/uploads/albums/${item.song.album_img}`
            : "/default-cover.png",
          premium: item.song.premium,
        }));
        setPlaylist({ ...data, songs: mappedSongs.map((song: Song) => ({ song })) });
        setSongList(mappedSongs);
        setNewTitle(data.name);
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError("Đã xảy ra lỗi khi tải playlist.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableSongs = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/songs/");
        if (!response.ok) throw new Error("Không thể tải danh sách bài hát.");
        const data = await response.json();
        console.log("Songs API response:", data); // Debug: Log API response
        const mappedSongs = data.map((song: any) => ({
          id: song.id,
          name: song.name,
          artist: song.artist_name,
          album: song.album_name || null, // Use album_name
          duration: song.duration,
          song_url: song.song_url,
          image_url: song.album_img
            ? `/uploads/albums/${song.album_img}`
            : "/default-cover.png",
          premium: song.premium,
        }));
        setAvailableSongs(mappedSongs);
      } catch (err) {
        console.error("Error fetching songs:", err);
        setError("Đã xảy ra lỗi khi tải danh sách bài hát.");
      }
    };

    fetchPlaylist();
    fetchAvailableSongs();
  }, [id, setSongList]);

  const handleDeleteSong = useCallback(
    async (songId: number) => {
      if (!playlist) return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/playlist_songs/${id}/${songId}/`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Không thể xóa bài hát.");
        const updatedSongs = playlist.songs.filter((item) => item.song.id !== songId);
        setPlaylist({ ...playlist, songs: updatedSongs });
        setSongList(updatedSongs.map((item) => item.song));
      } catch (err) {
        setError("Đã xảy ra lỗi khi xóa bài hát.");
      }
    },
    [playlist, id, setSongList]
  );

  const handlePlaySongClick = useCallback(
    (song: Song) => {
      handlePlaySong(song);
    },
    [handlePlaySong]
  );

  const handleAddSong = useCallback(
    async (song: Song) => {
      if (!playlist || playlist.songs.some((item) => item.song.id === song.id)) {
        alert("Bài hát đã có trong playlist!");
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/playlist_songs/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playlist_id: id, song_id: song.id }),
        });
        if (!response.ok) throw new Error("Không thể thêm bài hát.");
        const data = await response.json();
        const newSong = {
          id: data.song.id,
          name: data.song.name,
          artist: data.song.artist_name,
          album: data.song.album_name || null, // Use album_name
          duration: data.song.duration,
          song_url: data.song.song_url,
          image_url: data.song.album_img
            ? `/uploads/albums/${data.song.album_img}`
            : "/default-cover.png",
          premium: data.song.premium,
        };
        const updatedSongs = [...playlist.songs, { song: newSong }];
        setPlaylist({ ...playlist, songs: updatedSongs });
        setSongList(updatedSongs.map((item) => item.song));
        setIsAddFormVisible(false);
      } catch (err) {
        setError("Đã xảy ra lỗi khi thêm bài hát.");
      }
    },
    [playlist, id, setSongList]
  );

  const handleRenamePlaylist = useCallback(
    async () => {
      if (!playlist || newTitle.trim() === "") return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/playlists/update/${id}/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newTitle.trim() }),
          }
        );
        if (!response.ok) throw new Error("Không thể đổi tên playlist.");
        const data = await response.json();
        setPlaylist({ ...playlist, name: data.name });
        setIsEditingTitle(false);
        setIsMenuVisible(false);
      } catch (err) {
        setError("Đã xảy ra lỗi khi đổi tên playlist.");
      }
    },
    [playlist, newTitle, id]
  );

  const handleConfirmDeletePlaylist = useCallback(
    async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/playlists/delete/${id}/`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) throw new Error("Không thể xóa playlist.");
        navigate("/");
      } catch (err) {
        setError("Đã xảy ra lỗi khi xóa playlist.");
      }
    },
    [id, navigate]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent, song: Song) => {
      e.stopPropagation();
      if (song.premium === 1 && !isPremiumUser) {
        alert("Bạn cần tài khoản Premium để tải bài hát này.");
        return;
      }
      const songUrl = `http://localhost:8000/audio/${song.song_url}`;
      const xhr = new XMLHttpRequest();
      xhr.open("GET", songUrl, true);
      xhr.responseType = "blob";
      xhr.onload = () => {
        const blob = xhr.response;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${song.name}.mp3`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      };
      xhr.onerror = () => {
        alert("Không thể tải bài hát này.");
      };
      xhr.send();
    },
    [isPremiumUser]
  );

  const filteredSongs = availableSongs.filter(
    (song) =>
      song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return <div className="p-6 text-gray-400 text-center">Đang tải...</div>;
  if (!playlist)
    return (
      <div className="p-6 text-gray-400 text-center">Không tìm thấy playlist.</div>
    );

  return (
    <div className="p-6 bg-gradient-to-b from-gray-900 to-black min-h-screen text-gray-200">
      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>
      )}
      <div className="mr-5 ml-5">
        <div className="mb-8">
          <div className="relative flex items-center justify-between">
            {isEditingTitle ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleRenamePlaylist}
                >
                  Lưu
                </button>
                <button
                  className="px-4 py-1 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setNewTitle(playlist.name);
                  }}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-white">{playlist.name}</h1>
            )}
            <div className="relative">
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsMenuVisible(!isMenuVisible)}
              >
                <Menu size={24} />
              </button>
              {isMenuVisible && (
                <div className="absolute top-8 right-0 bg-gray-800 shadow-lg rounded-lg py-2 w-48 z-10 border border-gray-700">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setIsEditingTitle(true);
                      setIsMenuVisible(false);
                    }}
                  >
                    Đổi tên playlist
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    onClick={() => setIsDeleteConfirmVisible(true)}
                  >
                    Xóa playlist
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {playlist.songs.length} bài hát
          </p>
          <div className="mt-4 flex items-center gap-4">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
              onClick={() =>
                playlist.songs[0] && handlePlaySongClick(playlist.songs[0].song)
              }
            >
              <PlayIcon size={18} />
              Phát tất cả
            </button>
            <button
              className="px-6 py-2 bg-green-500 text-white rounded-full flex items-center gap-2 hover:bg-green-600 transition-colors"
              onClick={() => setIsAddFormVisible(true)}
            >
              <PlusCircleIcon size={18} />
              Thêm bài hát
            </button>
          </div>
        </div>
      </div>
      {isAddFormVisible && (
        <div className="mb-6 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mr-5 ml-5">
          <h3 className="text-lg font-semibold mb-4 text-white">Thêm bài hát</h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
            className="w-full px-4 py-2 mb-4 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-700">
            {filteredSongs.map((song) => (
              <li
                key={song.id}
                className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      song.image_url
                    }
                    alt={song.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {song.name}
                      {song.premium === 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{song.artist}</div>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-green-500 transition-colors"
                  onClick={() => handleAddSong(song)}
                >
                  <PlusCircleIcon size={20} />
                </button>
              </li>
            ))}
          </ul>
          <button
            className="mt-4 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => setIsAddFormVisible(false)}
          >
            Hủy
          </button>
        </div>
      )}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg mr-5 ml-5">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-6 py-4 text-xs font-medium uppercase w-12">#</th>
              <th className="px-6 py-4 text-xs font-medium uppercase">Tiêu đề</th>
              <th className="px-6 py-4 text-xs font-medium uppercase">Album</th>
              <th className="px-6 py-4 text-xs font-medium uppercase">
                <Clock3Icon size={14} className="inline" />
              </th>
              <th className="px-6 py-4 text-xs font-medium uppercase">Tải về</th>
              <th className="px-6 py-4 text-xs font-medium uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {playlist.songs.map((item, index) => {
              const song = item.song;
              return (
                <tr
                  key={song.id}
                  className="hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handlePlaySongClick(song)}
                >
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={song.image_url}
                        alt={song.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          {song.name}
                          {song.premium === 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {song.artist}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {song.album || "Không có album"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDuration(song.duration)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      onClick={(e) => handleDownload(e, song)}
                    >
                      <CircleEllipsis size={20} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSong(song.id);
                      }}
                    >
                      <Trash2Icon size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isDeleteConfirmVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-96 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-white">
              Xác nhận xóa playlist
            </h3>
            <p className="mb-6 text-gray-300">
              Bạn có chắc chắn muốn xóa playlist này không? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={() => setIsDeleteConfirmVisible(false)}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleConfirmDeletePlaylist}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlist;