import React, { useState, useEffect } from "react";
import { PlayIcon, CircleEllipsis } from "lucide-react";
import { useAudio } from "../../../AudioContext";
import {useNavigate} from "react-router-dom";

interface Song {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  premium: number;
}
interface Album {
  id: number;
  name: string;
  cover_image: string;
  artist_name: string;
}

const Home: React.FC = () => {
  const { handlePlaySong, setSongList } = useAudio();
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);

  // Lấy trạng thái premium từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPremiumUser = user?.isPremium === true;

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchTopSongs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/api/songs/?ordering=-play_count");
        if (!response.ok) throw new Error("Không thể tải bảng xếp hạng.");
        const data = await response.json();

        // Chỉ lấy 10 bài hát đầu tiên
        const top10Songs = data.slice(0, 10);

        const mappedSongs = top10Songs.map((song: any) => ({
          id: song.id,
          name: song.name || "Unknown Song",
          artist: song.artist_name || "Unknown Artist",
          album: song.album_name || null,
          duration: song.duration || 1,
          song_url: song.song_url || "",
          image_url: song.album_img
            ? `/uploads/albums/${song.album_img}`
            : "/default-cover.png",
          premium: song.premium || 0,
        }));

        setTopSongs(mappedSongs);

        // Cập nhật songList chỉ với topSongs
        setSongList(mappedSongs);
        console.log("Set songList in Home (Top Songs):", mappedSongs);
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải bảng xếp hạng.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/albums/");
        if (!response.ok) throw new Error("Không thể tải danh sách album.");
        const data = await response.json();
        // const filteredAlbums = data.filter((album: any) => album.songs && album.songs.length > 0);
        setAlbums(data);
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách album.");
        console.error(err);
      }
    };

    fetchAlbums();
    fetchTopSongs();
  }, [setSongList]);

  const handleDownload = (e: React.MouseEvent, song: Song) => {
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
  };
  const navigate = useNavigate();
  // Hàm phát bài từ recentlyPlayed, không chuyển bài
  const handleNavigateToAlbum = (albumId: number) => {
    navigate(`/viewalbum/${albumId}`);
  };

  return (
    <div className="space-y-8 bg-[#121212] text-white p-6">
      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>
      )}
      <section>
        <h2 className="text-3xl font-bold mb-4">Danh sách các Albums</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-[#181818] rounded-lg p-4 transition-all hover:bg-[#282828] cursor-pointer"
              onClick={() => handleNavigateToAlbum(album.id)}
            >
              <div className="relative group">
                <img
                  src={`/uploads/albums/${album.cover_image}`}
                  alt={album.name}
                  className="w-full aspect-square object-cover rounded-md mb-3"
                />
                <button className="absolute bottom-3 right-3 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayIcon size={24} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-md truncate">{album.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{album.artist_name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-4">Bảng xếp hạng âm nhạc</h2>
        <div className="bg-[#181818] rounded-lg overflow-hidden">
          {isLoading ? (
            <p className="p-4 text-gray-400">Đang tải bảng xếp hạng...</p>
          ) : topSongs.length === 0 ? (
            <p className="p-4 text-gray-400">Không có bài hát nào trong bảng xếp hạng.</p>
          ) : (
            <div className="divide-y divide-[#282828]">
              {topSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center p-4 hover:bg-[#282828] transition-all cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="w-12 text-lg font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="relative group flex-shrink-0">
                      <img
                        src={song.image_url}
                        alt={song.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayIcon size={20} className="text-green-500" />
                      </button>
                    </div>
                    <div className="ml-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-md truncate">{song.name}</h3>
                        {song.premium === 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                  <div className="w-24 text-sm text-gray-400 text-center">
                    {formatDuration(song.duration)}
                  </div>
                  <div className="w-24 text-center">
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      onClick={(e) => handleDownload(e, song)}
                    >
                      <CircleEllipsis size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;