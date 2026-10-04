import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_ORIGIN } from "../config/api";
import axios from "axios";
import {
  Clock3Icon,
  Play,
  Tv,
  Heart,
  BookmarkPlus,
  Check,
  Cloud,
  Sparkles,
  Music,
  AlertCircle,
} from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount, Song } from "../AudioContext";
import { searchSpotifyTracks, saveExternalSong } from "../services/spotify";
import { isSongLoved, toggleLovedSong } from "../services/favorites";
import { getImageUrl, formatDuration } from "../utils/media";
import { debounce } from "lodash";

type SearchTab = "all" | "spotify" | "local";

interface SearchResultsProps {
  query?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query: propQuery }) => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || "";
  const query = (propQuery !== undefined ? propQuery : urlQuery).trim();

  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [spotifySongs, setSpotifySongs] = useState<Song[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [loading, setLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<"idle" | "searching_local" | "searching_cloud" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lovedIds, setLovedIds] = useState<Set<string>>(() => new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Tự ẩn thông báo toast sau 3.5s
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Luồng tìm kiếm bài hát thông minh:
  // 1. Tìm trong thư viện cục bộ trước
  // 2. Nếu không có sẵn -> tự động gọi API tìm kiếm trực tuyến (Cloud Music)
  const fetchSearchResults = useCallback(
    debounce(async (searchQuery: string) => {
      const q = searchQuery.trim();
      if (!q) {
        setLocalSongs([]);
        setSpotifySongs([]);
        setLoading(false);
        setSearchStep("idle");
        return;
      }

      setLoading(true);
      setError(null);
      setSearchStep("searching_local");

      try {
        // Bước 1: Tìm trong database nội bộ trước
        const localRes = await axios.get(`${API_ORIGIN}/api/songs/`, { params: { search: q } });
        const raw = localRes.data;
        const list = Array.isArray(raw) ? raw : (raw?.results || []);
        const localData: Song[] = list.map((song: any) => ({
          id: song.id,
          name: song.name,
          artist: song.artist_name || song.artist?.name || "Nghệ sĩ",
          album: song.album_name || song.album?.name || null,
          duration: song.duration || 180,
          song_url: song.song_url || "",
          image_url: getImageUrl(song.image_url || song.album_img),
          premium: song.premium ?? 0,
          source: "local" as const,
        }));

        setLocalSongs(localData);

        // Bước 2: Kiểm tra kết quả
        if (localData.length === 0) {
          // Không có trong thư viện nội bộ -> Tự động gọi API tìm kiếm trực tuyến
          setSearchStep("searching_cloud");
          const cloudTracks = await searchSpotifyTracks(q);
          setSpotifySongs(cloudTracks);
          setActiveTab("spotify");
        } else {
          // Đã có trong thư viện -> Tải thêm kết quả trực tuyến trong nền để người dùng có nhiều lựa chọn
          searchSpotifyTracks(q).then((cloudTracks) => {
            setSpotifySongs(cloudTracks);
          });
          setActiveTab("all");
        }
      } catch (err) {
        console.error("Lỗi khi tìm kiếm bài hát:", err);
        // Nếu API nội bộ lỗi, fallback ngay sang API trực tuyến
        try {
          setSearchStep("searching_cloud");
          const cloudTracks = await searchSpotifyTracks(q);
          setSpotifySongs(cloudTracks);
          setActiveTab("spotify");
        } catch {
          setError("Không thể tải kết quả tìm kiếm. Vui lòng kiểm tra kết nối mạng.");
        }
      } finally {
        setLoading(false);
        setSearchStep("done");
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSearchResults(query);
    return () => {
      fetchSearchResults.cancel();
    };
  }, [query, fetchSearchResults]);

  // Lưu bài hát trực tuyến vào thư viện nội bộ
  const handleSaveToLibrary = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    const idStr = String(song.id);
    if (savedIds.has(idStr)) return;

    setSavingId(idStr);
    try {
      const savedSong = await saveExternalSong(song);
      if (savedSong) {
        setSavedIds((prev) => new Set([...prev, idStr]));
        // Thêm vào danh sách local
        setLocalSongs((prev) => [
          {
            id: savedSong.id,
            name: savedSong.name,
            artist: savedSong.artist_name || song.artist,
            album: savedSong.album_name || song.album,
            duration: savedSong.duration || song.duration,
            song_url: savedSong.song_url || "",
            image_url: getImageUrl(savedSong.image_url || song.image_url),
            premium: savedSong.premium || 0,
            source: "local" as const,
          },
          ...prev,
        ]);
        setToastMsg(`Đã lưu "${song.name}" vào thư viện thành công!`);
      } else {
        setToastMsg(`Không thể lưu "${song.name}". Vui lòng thử lại.`);
      }
    } catch (err) {
      console.error("Lỗi lưu bài hát:", err);
      setToastMsg(`Lỗi khi lưu bài hát.`);
    } finally {
      setSavingId(null);
    }
  };

  const displayedSongs =
    activeTab === "spotify"
      ? spotifySongs
      : activeTab === "local"
      ? localSongs
      : [...localSongs, ...spotifySongs];

  const handlePlay = (song: Song, forceMv: boolean = false) => {
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
      return;
    }
    setSongList(displayedSongs);
    handlePlaySong(song, forceMv);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast thông báo lưu bài hát */}
      {toastMsg && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#1DB954] text-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tiêu đề & Thanh chuyển Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Kết quả cho "{query}"</span>
            {searchStep === "searching_cloud" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                <Cloud size={14} />
                Đang gọi Cloud Music API...
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tổng cộng: {displayedSongs.length} bài hát ({localSongs.length} trong thư viện, {spotifySongs.length} trực tuyến)
          </p>
        </div>

        {/* Bộ lọc Tabs */}
        <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-full border border-[#282828] self-start md:self-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-white text-black shadow font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Tất cả ({localSongs.length + spotifySongs.length})
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "local"
                ? "bg-white text-black shadow font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Music size={13} />
            Thư viện ({localSongs.length})
          </button>
          <button
            onClick={() => setActiveTab("spotify")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "spotify"
                ? "bg-[#1DB954] text-black font-bold shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Cloud size={13} />
            Trực tuyến Cloud ({spotifySongs.length})
          </button>
        </div>
      </div>

      {/* Thông báo thông minh khi tự động tìm trực tuyến vì thư viện nội bộ chưa có */}
      {!loading && localSongs.length === 0 && spotifySongs.length > 0 && query.trim() !== "" && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#181818] to-blue-950/40 border border-emerald-500/30 flex items-start gap-3.5 shadow-lg">
          <Sparkles className="text-[#1DB954] mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <span className="font-bold text-white block">
              Tự động tìm kiếm qua Cloud Music API (Apple Music & Spotify)
            </span>
            <p className="text-gray-300 mt-0.5">
              Bài hát chưa có trong thư viện nội bộ. Hệ thống đã tự động kết nối API trực tuyến và tìm thấy <strong className="text-[#1DB954]">{spotifySongs.length}</strong> bài hát. Bạn có thể nhấn để nghe ngay hoặc bấm biểu tượng <strong className="text-white">+ Lưu</strong> để thêm vào thư viện vĩnh viễn!
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">
            {searchStep === "searching_cloud"
              ? "Chưa có trong thư viện nội bộ. Đang tự động tìm kiếm trên Music Cloud API..."
              : "Đang tìm kiếm bài hát..."}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && displayedSongs.length === 0 && query.trim() !== "" && (
        <div className="text-center py-16 bg-[#181818] rounded-2xl border border-[#282828] text-gray-400 max-w-xl mx-auto">
          <Music size={40} className="mx-auto mb-3 text-gray-600" />
          <p className="text-lg font-semibold text-white">Không tìm thấy bài hát nào cho "{query}"</p>
          <p className="text-sm text-gray-500 mt-1 px-4">
            Hãy thử tìm bằng tên bài hát, nghệ sĩ (ví dụ: Sơn Tùng, Vũ, Taylor Swift, Bruno Mars...).
          </p>
        </div>
      )}

      {/* Danh sách kết quả bài hát */}
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
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center w-36">
                  Thao tác
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
                const isExternal = song.source === "spotify" || song.source === "youtube";
                const isSaved = savedIds.has(String(song.id));
                const isBeingSaved = savingId === String(song.id);

                return (
                  <tr
                    key={`${song.source || 'song'}_${song.id}_${index}`}
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
                          src={getImageUrl(song.image_url)}
                          alt={song.name}
                          className="h-11 w-11 rounded-md object-cover flex-shrink-0 shadow bg-[#222]"
                          onError={(e) => {
                            e.currentTarget.src = "/default-cover.png";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-[#1DB954] transition truncate flex items-center gap-2">
                            <span>{song.name}</span>
                            {isExternal ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1DB954] text-black">
                                Cloud Music
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-700 text-gray-200">
                                Thư viện
                              </span>
                            )}
                            {isPremium && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                                VIP
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
                        {song.album || (isExternal ? "Đĩa đơn trực tuyến" : "Đĩa đơn")}
                      </span>
                    </td>

                    {/* Actions: Save to library, MV, Love */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Nút lưu vào thư viện (cho bài trực tuyến) */}
                        {isExternal && (
                          <button
                            onClick={(e) => handleSaveToLibrary(song, e)}
                            disabled={isSaved || isBeingSaved}
                            title={isSaved ? "Đã lưu vào thư viện" : "Lưu vào thư viện bài hát"}
                            className={`p-1.5 rounded-lg transition ${
                              isSaved
                                ? "text-[#1DB954] bg-[#1DB954]/10 cursor-default"
                                : "text-gray-400 hover:text-white hover:bg-[#333]"
                            }`}
                          >
                            {isBeingSaved ? (
                              <div className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                            ) : isSaved ? (
                              <Check size={16} />
                            ) : (
                              <BookmarkPlus size={16} />
                            )}
                          </button>
                        )}

                        {/* Nút xem MV / Video YouTube */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(song, true);
                          }}
                          title="Xem MV / Video YouTube"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333] transition"
                        >
                          <Tv size={16} />
                        </button>

                        {/* Nút yêu thích */}
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