import { useParams } from "react-router-dom";
import {
  PlayIcon,
  HeartIcon,
  Menu,
  Clock3Icon,
  Trash2Icon,
  PlusCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useMusicStore } from "../stores/useMusicStore"; // Giả định đường dẫn tới MusicStore

interface PlaylistProps {
  setCurrentSong: (song: {
    title: string;
    artist: string;
    image_url: string;
  }) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ setCurrentSong }) => {
  const { id } = useParams<string>(); // id là string từ url vd: 127.0.0.1:5173/playlist/1 => id = 1
  const { currentAlbum, songs, loading, error, fetchAlbumById, fetchSongs } =
    useMusicStore();

  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  // Mock danh sách bài hát có thể thêm (sẽ thay bằng songs từ store)
  const availableSongs = songs.length > 0 ? songs : [];

  // Fetch dữ liệu khi component mount hoặc id thay đổi
  useEffect(() => {
    if (id) {
      fetchAlbumById(parseInt(id)); // Gọi API để lấy album theo id
    }
  }, [id, fetchAlbumById]);

  // Đồng bộ newTitle với currentAlbum khi nó thay đổi
  useEffect(() => {
    if (currentAlbum) {
      setNewTitle(currentAlbum.title);
    }
  }, [currentAlbum]);

  //  TODO: loading
  if (loading) return <div className="p-6">Loading...</div>;
  // Xử lý  error
  if (error || !currentAlbum)
    return (
      <div className="p-6">
        <p className="text-center text-gray-600">
          {error || "Playlist không tồn tại"}
        </p>
      </div>
    );

  // Phát bài hát
  const handlePlaySong = (song: (typeof currentAlbum.songs)[0]) => {
    setCurrentSong({
      title: song.title,
      artist: song.artist,
      image_url: song.image_url,
    });
  };

  // Xóa bài hát khỏi playlist (mock)
  const handleDeleteSong = (songId: number) => {
    const updatedSongs = currentAlbum.songs.filter(
      (song) => song.id !== songId
    );
    useMusicStore.setState({
      currentAlbum: { ...currentAlbum, songs: updatedSongs },
    });
  };

  // Thêm bài hát vào playlist (mock)
  const handleAddSong = (song: (typeof songs)[0]) => {
    if (!currentAlbum.songs.some((s) => s.id === song.id)) {
      useMusicStore.setState({
        currentAlbum: {
          ...currentAlbum,
          songs: [...currentAlbum.songs, song],
        },
      });
    }
    setIsAddFormVisible(false);
    setSearchTerm("");
  };

  // Tìm kiếm bài hát
  const filteredSongs = availableSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Đổi tên playlist (mock)
  const handleRenamePlaylist = () => {
    useMusicStore.setState({
      currentAlbum: { ...currentAlbum, title: newTitle },
    });
    setIsEditingTitle(false);
    setIsMenuVisible(false);
  };

  // Mở hộp thoại xác nhận xóa playlist
  const handleOpenDeleteConfirm = () => {
    setIsMenuVisible(false);
    setIsDeleteConfirmVisible(true);
  };

  // Xác nhận xóa playlist (mock)
  const handleConfirmDeletePlaylist = () => {
    alert("Playlist đã được xóa!");
    useMusicStore.setState({ currentAlbum: null });
    setIsDeleteConfirmVisible(false);
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <img
          src={currentAlbum.image_url || "https://via.placeholder.com/150"}
          alt={currentAlbum.title}
          className="w-48 h-48 object-cover rounded-lg shadow-md"
        />
        <div className="relative flex-1">
          <button
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-800"
            onClick={() => setIsMenuVisible(!isMenuVisible)}
          >
            <Menu size={18} />
          </button>
          {isMenuVisible && (
            <div className="absolute top-6 right-0 bg-white shadow-lg rounded-md py-2 w-40 z-10">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setIsEditingTitle(true);
                  setIsMenuVisible(false);
                }}
              >
                Đổi tên playlist
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={handleOpenDeleteConfirm}
              >
                Xóa playlist
              </button>
            </div>
          )}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-3xl font-bold border border-gray-300 rounded px-2 py-1"
              />
              <button
                className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                onClick={handleRenamePlaylist}
              >
                Lưu
              </button>
              <button
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => {
                  setIsEditingTitle(false);
                  setNewTitle(currentAlbum.title);
                }}
              >
                Hủy
              </button>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-2">{currentAlbum.title}</h1>
          )}
          <p className="text-gray-600 mb-4">{currentAlbum.description}</p>
          <p className="text-sm text-gray-500">
            {currentAlbum.songs.length} songs
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button className="px-6 py-2 bg-gray-800 text-white rounded-full flex items-center gap-2 hover:bg-gray-700">
              <PlayIcon size={18} />
              Play All
            </button>
            <button
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full flex items-center gap-2 hover:bg-gray-300"
              onClick={() => setIsAddFormVisible(true)}
            >
              <PlusCircleIcon size={18} />
              Add Song
            </button>
          </div>
        </div>
      </div>

      {/* Form thêm bài hát */}
      {isAddFormVisible && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Add a Song</h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a song..."
            className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <ul className="max-h-48 overflow-y-auto">
            {filteredSongs.map((song) => (
              <li
                key={song.id}
                className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleAddSong(song)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={song.image_url || "https://via.placeholder.com/40"}
                    alt={song.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium">{song.title}</div>
                    <div className="text-xs text-gray-500">{song.artist}</div>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  <PlusCircleIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          <button
            className="mt-4 px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
            onClick={() => setIsAddFormVisible(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Danh sách bài hát */}
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                #
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artist
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <Clock3Icon size={14} />
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentAlbum.songs.map((song, index) => (
              <tr
                key={song.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handlePlaySong(song)}
              >
                <td className="px-6 py-4 whitespace-nowrap"></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={song.image_url || "https://via.placeholder.com/40"}
                      alt={song.title}
                      className="h-10 w-10 rounded object-cover mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-500">{song.artist}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {song.artist}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {song.duration || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-800">
                      <HeartIcon size={18} />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSong(song.id);
                      }}
                    >
                      <Trash2Icon size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal xác nhận xóa playlist */}
      {isDeleteConfirmVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-80">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa playlist</h3>
            <p className="mb-4">
              Bạn có chắc chắn muốn xóa playlist này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => setIsDeleteConfirmVisible(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleConfirmDeletePlaylist}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlist;
