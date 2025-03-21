import React, { useEffect } from "react";
import { PlayIcon } from "lucide-react";
import { useMusicStore } from "../stores/useMusicStore";
import { Song } from "../types";

interface HomeProps {
  setCurrentSong: (song: Song) => void;
}

// Xáo trộn mảng
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]; // Tạo bản sao để không thay đổi mảng gốc
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home: React.FC<HomeProps> = ({ setCurrentSong }) => {
  const { songs, albums, loading, error, fetchSongs, fetchAlbums } =
    useMusicStore();

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchSongs(); // Lấy danh sách bài hát cho "Recently Played"
    fetchAlbums(); // Lấy danh sách album cho "Recommended Playlists"
  }, [fetchSongs, fetchAlbums]);

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
  };

  // Xử lý loading và error states
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">{error}</div>;

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shuffleArray(songs)
            .slice(0, 4) // Giới hạn 4 bài hát cho "Recently Played"
            .map((song) => (
              <div
                key={song.id}
                className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100"
                onClick={() => handlePlaySong(song)}
              >
                <div className="relative group">
                  <img
                    src={song.image_url || "https://via.placeholder.com/150"}
                    alt={song.title}
                    className="w-full aspect-square object-cover rounded-md mb-3"
                  />
                  <button className="absolute bottom-3 right-3 h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon size={20} />
                  </button>
                </div>
                <h3 className="font-medium text-sm">{song.title}</h3>
                <p className="text-xs text-gray-500">{song.artist}</p>
              </div>
            ))}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shuffleArray(albums)
            .slice(0, 3) // Giới hạn 3 playlist cho "Recommended Playlists"
            .map((playlist) => (
              <div
                key={playlist.id}
                className="bg-gray-50 rounded-lg overflow-hidden"
              >
                <img
                  src={playlist.image_url || "https://via.placeholder.com/150"}
                  alt={playlist.title}
                  className="w-full h-32 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium">{playlist.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {playlist.description || "No description available"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
