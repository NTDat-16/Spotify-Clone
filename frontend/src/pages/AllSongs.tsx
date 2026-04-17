import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PlayIcon, Clock3Icon, CircleEllipsis } from "lucide-react";
import { useAudio } from "../AudioContext";

type Song = {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  premium: number;
};

const AllSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { handlePlaySong, setSongList } = useAudio();
  
  // Placeholder for user premium status (replace with actual logic)
  const isPremiumUser = false; // Example: Replace with auth context or API call to check user status

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/songs/")
      .then((response) => {
        const mappedSongs = response.data.map((song: any) => ({
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
        setSongs(mappedSongs);
        setSongList(mappedSongs);
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
        alert("Không thể tải danh sách bài hát.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setSongList]);

  const handlePlayAll = useCallback(() => {
    if (songs.length > 0) {
      handlePlaySong(songs[0]);
    }
  }, [songs, handlePlaySong]);

  const handleDownload = useCallback((e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent triggering the song play event

    // Check if the song is premium and if the user is not premium
    if (song.premium === 1 && !isPremiumUser) {
      alert("Bạn cần tài khoản Premium để tải bài hát này.");
      return;
    }

    // Proceed with download if the song is non-premium or the user is premium
    const songUrl = `http://127.0.0.1:8000/audio/${song.song_url}`;
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
  }, [isPremiumUser]); // Add isPremiumUser as a dependency

  if (loading) {
    return <div className="p-6 text-gray-400">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-3xl font-bold mb-2 p-5">All Songs</h1>
        </div>
        <button
          onClick={handlePlayAll}
          className="px-6 py-2 bg-gray-800 text-white rounded-full flex items-center gap-2 hover:bg-gray-700"
        >
          <PlayIcon size={18} />
          Play All
        </button>
      </div>
      <div className="bg-[#181818] rounded-lg overflow-hidden mr-5 ml-5">
        <table className="w-full">
          <thead className="bg-[#282828] text-left">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                #
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Album
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Clock3Icon size={14} />
              </th>
              <th
                style={{ width: "8%" }}
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
              >
                Tải về
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]">
            {songs.length > 0 ? (
              songs.map((song, index) => (
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
                        src={song.image_url}
                        alt={song.name}
                        className="h-10 w-10 rounded object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          {song.name}
                          {song.premium === 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                              Premium
                            </span>
                          )}
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
                  <td>
                    <button
                      onClick={(e) => handleDownload(e, song)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex justify-center items-center"
                    >
                      <CircleEllipsis />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Không có bài hát nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default AllSongs;