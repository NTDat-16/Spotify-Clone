import { useEffect, useState, useCallback } from "react";
import { API_ORIGIN } from "../config/api";
import axios from "axios";
import { PlayIcon, Clock3Icon, CircleEllipsis, Heart } from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount } from "../AudioContext";
import { getLovedSongs, toggleLovedSong } from "../services/favorites";
import { getAudioUrl } from "../utils/media";

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
  const [lovedIds, setLovedIds] = useState<Set<number>>(() => new Set(getLovedSongs().map((s) => s.id)));
  const { handlePlaySong, setSongList } = useAudio();

  useEffect(() => {
    const handleUpdate = () => {
      setLovedIds(new Set(getLovedSongs().map((s) => s.id)));
    };
    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_ORIGIN}/api/songs/`)
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
      const isUserPremium = isUserPremiumAccount();
      const firstPlayableSong = isUserPremium
        ? songs[0]
        : songs.find((s) => !isPremiumSong(s));
      if (firstPlayableSong) {
        handlePlaySong(firstPlayableSong);
      } else {
        alert("Tất cả bài hát đều yêu cầu tài khoản Premium!");
      }
    }
  }, [songs, handlePlaySong]);

  const handleDownload = useCallback((e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent triggering the song play event

    // Check if the song is premium and if the user is not premium
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bạn cần tài khoản Premium để tải bài hát này.");
      return;
    }

    // Proceed with download if the song is non-premium or the user is premium
    const songUrl = getAudioUrl(song.song_url);
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
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-400">Đang tải...</div>;
  }

  const isUserPremium = isUserPremiumAccount();

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-3xl font-bold mb-2 p-5">All Songs</h1>
        </div>
        <button
          onClick={handlePlayAll}
          className="px-6 py-2 bg-gray-800 text-white rounded-full flex items-center gap-2 hover:bg-gray-700 transition"
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
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-24"
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]">
            {songs.length > 0 ? (
              songs.map((song, index) => {
                const songIsPremium = isPremiumSong(song);
                return (
                  <tr
                    key={song.id}
                    className="bg-[#181818] hover:bg-[#282828] cursor-pointer transition-colors"
                    onClick={() => {
                      if (songIsPremium && !isUserPremium) {
                        alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
                        return;
                      }
                      handlePlaySong(song);
                    }}
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
                            {songIsPremium && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLovedSong(song);
                          }}
                          title={lovedIds.has(song.id) ? "Xóa khỏi yêu thích" : "Yêu thích"}
                          className="text-gray-400 hover:text-white transition p-1"
                        >
                          <Heart
                            size={18}
                            className={lovedIds.has(song.id) ? "fill-[#1DB954] text-[#1DB954]" : "text-gray-400 hover:text-white"}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, song)}
                          title="Tải về"
                          className="text-gray-400 hover:text-white transition p-1"
                        >
                          <CircleEllipsis size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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