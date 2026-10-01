import React, { useEffect, useState, useCallback } from "react";
import { API_ORIGIN } from "../config/api";
import axios from "axios";
import { Clock3Icon, Play, Tv, Heart } from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount, Song } from "../AudioContext";
import { searchSpotifyTracks } from "../services/spotify";
import { isSongLoved, toggleLovedSong } from "../services/favorites";
import { debounce } from "lodash";

type SearchTab = "all" | "spotify" | "local";

const SearchResults: React.FC<{ query: string }> = ({ query }) => {
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [spotifySongs, setSpotifySongs] = useState<Song[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lovedIds, setLovedIds] = useState<Set<string>>(() => new Set());

  const { handlePlaySong, setSongList } = useAudio();

  const syncLovedState = () => {
    try {
      const raw = localStorage.getItem("spotify_loved_songs");
      if (raw) {
        const arr = JSON.parse(raw);
        setLovedIds(new Set(arr.map((s: any) => String(s.id))));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncLovedState();
    const handleUpdate = () => syncLovedState();
    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, []);

  // Tìm kiếm kết hợp Local + Spotify Web API có debounce
  const fetchSearchResults = useCallback(
    debounce(async (searchQuery: string) => {
      const q = searchQuery.trim();
      if (!q) {
        setLocalSongs([]);
        setSpotifySongs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Chạy song song cả tìm kiếm nội bộ và Spotify API
        const [localRes, spotifyRes] = await Promise.allSettled([
          axios.get(`${API_ORIGIN}/api/songs/`, { params: { search: q } }),
          searchSpotifyTracks(q),
        ]);

        let localData: Song[] = [];
        if (localRes.status === "fulfilled" && Array.isArray(localRes.value.data)) {
          localData = localRes.value.data.map((song: any) => ({
            id: song.id,
            name: song.name,
            artist: song.artist_name || "Nghệ sĩ",
            album: song.album_name || null,
            duration: song.duration || 180,
            song_url: song.song_url || "",
            image_url: song.album_img
              ? `/uploads/albums/${song.album_img}`
              : "/default-cover.png",
            premium: song.premium ?? 0,
            source: "local" as const,
          }));
        }

        let spData: Song[] = [];
        if (spotifyRes.status === "fulfilled" && Array.isArray(spotifyRes.value)) {
          spData = spotifyRes.value;
        }

        setLocalSongs(localData);
        setSpotifySongs(spData);
      } catch (err) {
        setError("Không thể tải kết quả tìm kiếm.");
        console.error("Lỗi khi lấy kết quả tìm kiếm:", err);
      } finally {
        setLoading(false);
      }
    }, 350),
    []
  );

  useEffect(() => {
    fetchSearchResults(query);
    return () => {
      fetchSearchResults.cancel();
    };
  }, [query, fetchSearchResults]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayedSongs =
    activeTab === "spotify"
      ? spotifySongs
      : activeTab === "local"
      ? localSongs
      : [...spotifySongs, ...localSongs];

  const handlePlay = (song: Song, forceMv: boolean = false) => {
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
      return;
    }
    // Cập nhật danh sách bài hát cho hàng chờ
    setSongList(displayedSongs);
    handlePlaySong(song, forceMv);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Tiêu đề & Thanh chuyển Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Kết quả tìm kiếm cho "{query}"
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tổng cộng: {displayedSongs.length} kết quả
          </p>
        </div>

        {/* Bộ lọc Tabs */}
        <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-full border border-[#282828]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Tất cả ({spotifySongs.length + localSongs.length})
          </button>
          <button
            onClick={() => setActiveTab("spotify")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "spotify"
                ? "bg-[#1DB954] text-black font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-900" />
            Spotify Catalog ({spotifySongs.length})
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "local"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Thư viện ({localSongs.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-gray-400 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang tìm kiếm bài hát từ Spotify và thư viện...</span>
        </div>
      )}

      {error && <div className="p-6 text-red-500 bg-red-950/30 rounded-lg">{error}</div>}

      {!loading && displayedSongs.length === 0 && query.trim() !== "" && (
        <div className="text-center py-16 bg-[#181818] rounded-xl text-gray-400">
          <p className="text-lg">Không tìm thấy bài hát nào cho từ khóa "{query}".</p>
          <p className="text-sm text-gray-500 mt-2">
            Hãy thử tìm bằng tên bài hát, nghệ sĩ hoặc bài hit quốc tế trên Spotify.
          </p>
        </div>
      )}

      {!loading && displayedSongs.length > 0 && (
        <div className="bg-[#181818] rounded-xl overflow-hidden border border-[#282828] shadow-lg">
          <table className="w-full">
            <thead className="bg-[#222] text-left border-b border-[#282828]">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-12 text-center">
                  #
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tiêu đề & Nghệ sĩ
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Album / Nguồn
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center w-24">
                  Chế độ
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right w-24">
                  <div className="flex items-center justify-end gap-1">
                    <Clock3Icon size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]/60">
              {displayedSongs.map((song, index) => {
                const isPremium = isPremiumSong(song);
                const isLoved = lovedIds.has(String(song.id));
                const isSpotify = song.source === "spotify";

                return (
                  <tr
                    key={song.id}
                    className="group hover:bg-[#282828] transition-colors cursor-pointer select-none"
                    onClick={() => handlePlay(song, false)}
                  >
                    {/* Index / Play icon on hover */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-center text-gray-400">
                      <span className="group-hover:hidden">{index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(song, false);
                        }}
                        className="hidden group-hover:inline-flex items-center justify-center text-white hover:text-[#1DB954]"
                      >
                        <Play size={16} className="fill-current" />
                      </button>
                    </td>

                    {/* Song info & Image */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={song.image_url || "/default-cover.png"}
                          alt={song.name}
                          className="h-11 w-11 rounded-md object-cover flex-shrink-0 shadow"
                          onError={(e) => {
                            e.currentTarget.src = "/default-cover.png";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-[#1DB954] transition truncate flex items-center gap-2">
                            {song.name}
                            {isSpotify && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1DB954] text-black">
                                Spotify
                              </span>
                            )}
                            {isPremium && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {song.artist}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Album / Source */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                      <span className="truncate max-w-[200px] block" title={song.album || ""}>
                        {song.album || (isSpotify ? "Spotify Release" : "Single")}
                      </span>
                    </td>

                    {/* Quick MV / Action button */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(song, true);
                          }}
                          title="Xem MV / Video (YouTube)"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333] transition"
                        >
                          <Tv size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLovedSong(song as any);
                          }}
                          title={isLoved ? "Xóa khỏi yêu thích" : "Yêu thích"}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333] transition"
                        >
                          <Heart
                            size={16}
                            className={
                              isLoved
                                ? "fill-[#1DB954] text-[#1DB954]"
                                : "text-gray-400"
                            }
                          />
                        </button>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-right tabular-nums">
                      {formatDuration(song.duration)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SearchResults;