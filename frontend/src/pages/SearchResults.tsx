import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Clock3Icon } from "lucide-react";
import { useAudio } from "../AudioContext";
import { debounce } from "lodash";

type Song = {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
};

const SearchResults: React.FC<{ query: string }> = ({ query }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handlePlaySong } = useAudio();

  // Hàm tìm kiếm với debounce
  const fetchSearchResults = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim() === "") {
        setSongs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/songs/", {
          params: { search: searchQuery },
        });
        const data = response.data.map((song: any) => ({
          ...song,
          artist: song.artist_name,
        }));
        setSongs(data);
      } catch (err) {
        setError("Không thể tải kết quả tìm kiếm.");
        console.error("Lỗi khi lấy kết quả tìm kiếm:", err);
      } finally {
        setLoading(false);
      }
    }, 300), // Delay 300ms
    []
  );

  useEffect(() => {
    fetchSearchResults(query);
    // Hủy debounce khi component unmount
    return () => {
      fetchSearchResults.cancel();
    };
  }, [query, fetchSearchResults]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Đang tìm kiếm...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Kết quả tìm kiếm cho "{query}"</h1>
      {songs.length === 0 && query.trim() !== "" ? (
        <p className="text-gray-400">Không tìm thấy bài hát nào.</p>
      ) : (
        <div className="bg-[#181818] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#282828] text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  #
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Album
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Clock3Icon size={14} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]">
              {songs.map((song, index) => (
                <tr
                  key={song.id}
                  className="bg-[#181818] hover:bg-[#282828] cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={`http://127.0.0.1:8000${song.image_url}`}
                        alt={song.name}
                        className="h-10 w-10 rounded object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-300">
                          {song.name}
                        </div>
                        <div className="text-sm text-gray-500">{song.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {song.album || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(song.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SearchResults;