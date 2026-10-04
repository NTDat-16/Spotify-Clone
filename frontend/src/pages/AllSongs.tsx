import { useEffect, useState, useCallback, useMemo } from "react";
import { API_ORIGIN } from "../config/api";
import axios from "axios";
import {
  PlayIcon,
  Clock3Icon,
  CircleEllipsis,
  Heart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tv,
  Music,
  Sparkles,
} from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount } from "../AudioContext";
import { getLovedSongs, toggleLovedSong } from "../services/favorites";
import { getAudioUrl, getImageUrl } from "../utils/media";

type Song = {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  album_img?: string | null;
  cover_image?: string | null;
  premium: number;
  play_count?: number;
};

const AllSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [lovedIds, setLovedIds] = useState<Set<number>>(() => new Set(getLovedSongs().map((s) => Number(s.id))));
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalSongs, setTotalSongs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { handlePlaySong, setSongList } = useAudio();
  const isUserPremium = isUserPremiumAccount();

  useEffect(() => {
    const handleUpdate = () => {
      setLovedIds(new Set(getLovedSongs().map((s) => Number(s.id))));
    };
    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, []);

  const fetchSongs = useCallback(async (page: number, size: number, query: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        page_size: size,
      };
      if (query.trim()) {
        params.search = query.trim();
      }

      const response = await axios.get(`${API_ORIGIN}/api/songs/`, { params });
      const data = response.data;

      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
        setTotalSongs(data.length);
        setTotalPages(Math.ceil(data.length / size) || 1);
      } else if (data && Array.isArray(data.results)) {
        rawList = data.results;
        setTotalSongs(data.count || 0);
        setTotalPages(data.total_pages || Math.ceil((data.count || 0) / size) || 1);
      }

      const mappedSongs: Song[] = rawList.map((song: any) => ({
        id: song.id,
        name: song.name || "Unknown Song",
        artist: song.artist_name || (typeof song.artist === "string" ? song.artist : "Unknown Artist"),
        album: song.album_name || null,
        duration: song.duration || 180,
        song_url: song.song_url || "",
        image_url: getImageUrl(song.image_url || song.album_img || song.cover_image),
        premium: song.premium || 0,
        play_count: song.play_count || 0,
      }));

      setSongs(mappedSongs);
      setSongList(mappedSongs);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  }, [setSongList]);

  // Fetch when page, pageSize, or debounced search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSongs(currentPage, pageSize, searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchQuery, fetchSongs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePlayAll = useCallback(() => {
    if (songs.length > 0) {
      const firstPlayableSong = isUserPremium
        ? songs[0]
        : songs.find((s) => !isPremiumSong(s));
      if (firstPlayableSong) {
        setSongList(songs);
        handlePlaySong(firstPlayableSong as any, false);
      } else {
        alert("Tất cả bài hát trên trang này đều yêu cầu tài khoản Premium!");
      }
    }
  }, [songs, isUserPremium, setSongList, handlePlaySong]);

  const handleDownload = useCallback((e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (isPremiumSong(song) && !isUserPremium) {
      alert("Bạn cần tài khoản Premium để tải bài hát này.");
      return;
    }
    const songUrl = getAudioUrl(song.song_url);
    if (!songUrl) {
      alert(`Bài hát "${song.name}" được phát trực tuyến qua YouTube IFrame stream.`);
      return;
    }
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
      alert("Không thể tải file âm thanh này.");
    };
    xhr.send();
  }, [isUserPremium]);

  // Generate pagination page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalSongs);

  return (
    <div className="p-6 text-white pb-32 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 flex items-center justify-center text-black shadow-lg">
              <Music size={22} className="stroke-[2.5]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Tất Cả Bài Hát</h1>
          </div>
          <p className="text-sm text-gray-400">
            Kho thư viện với hơn {totalSongs > 0 ? totalSongs : "200"} ca khúc chất lượng cao & phát trực tuyến
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlayAll}
            disabled={songs.length === 0}
            className="px-6 py-2.5 bg-[#1DB954] text-black font-bold rounded-full flex items-center gap-2 hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition shadow-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            <PlayIcon size={18} className="fill-current" />
            <span>Phát trang này</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 bg-[#181818] p-3 rounded-xl border border-[#282828]">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bài hát, nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#242424] text-white rounded-lg border border-transparent focus:border-[#1DB954] focus:outline-none placeholder-gray-500 text-sm transition"
          />
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-xs text-gray-400 self-end sm:self-auto">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#242424] text-white border border-[#333] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#1DB954] cursor-pointer"
          >
            <option value={10}>10 bài / trang</option>
            <option value={20}>20 bài / trang</option>
            <option value={50}>50 bài / trang</option>
            <option value={100}>100 bài / trang</option>
          </select>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-[#181818] rounded-xl overflow-hidden border border-[#282828] shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-[#202020] text-gray-400 text-xs uppercase tracking-wider border-b border-[#282828]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">#</th>
              <th className="px-4 py-3.5">Tiêu đề bài hát</th>
              <th className="px-4 py-3.5 hidden md:table-cell">Album / Đĩa đơn</th>
              <th className="px-4 py-3.5 hidden sm:table-cell text-center w-24">Lượt nghe</th>
              <th className="px-4 py-3.5 text-right w-20">
                <Clock3Icon size={15} className="inline mr-2" />
              </th>
              <th className="px-4 py-3.5 text-center w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]/60 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải danh sách bài hát...</span>
                  </div>
                </td>
              </tr>
            ) : songs.length > 0 ? (
              songs.map((song, index) => {
                const songIsPremium = isPremiumSong(song);
                const isLoved = lovedIds.has(song.id);
                const rankNumber = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr
                    key={song.id}
                    className="hover:bg-[#252525] transition-colors cursor-pointer group"
                    onClick={() => {
                      if (songIsPremium && !isUserPremium) {
                        alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
                        return;
                      }
                      setSongList(songs);
                      handlePlaySong(song as any, false);
                    }}
                  >
                    <td className="px-4 py-3 text-center text-gray-400 font-medium text-xs">
                      {rankNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Cover Image thumbnail */}
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow bg-[#282828]">
                          <img
                            src={song.image_url}
                            alt={song.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            onError={(e) => {
                              e.currentTarget.src = "/default-cover.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <PlayIcon size={16} className="text-[#1DB954] fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Title and artist */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate group-hover:text-[#1DB954] transition text-sm">
                              {song.name}
                            </span>
                            {songIsPremium && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-black uppercase tracking-wider">
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

                    {/* Album / Single */}
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400 truncate max-w-xs">
                      {song.album ? (
                        <span className="text-gray-300 hover:text-white transition">{song.album}</span>
                      ) : (
                        <span className="text-gray-500 italic">Đĩa đơn (Single)</span>
                      )}
                    </td>

                    {/* Play count */}
                    <td className="px-4 py-3 hidden sm:table-cell text-center text-xs text-gray-400 font-mono">
                      {(song.play_count || 0).toLocaleString()}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-right text-xs text-gray-400 tabular-nums font-mono pr-4">
                      {formatDuration(song.duration)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSongList(songs);
                            handlePlaySong(song as any, true);
                          }}
                          title="Xem MV (YouTube)"
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition"
                        >
                          <Tv size={16} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLovedSong(song as any);
                          }}
                          title={isLoved ? "Xóa khỏi yêu thích" : "Yêu thích"}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition"
                        >
                          <Heart
                            size={16}
                            className={isLoved ? "fill-[#1DB954] text-[#1DB954]" : "text-gray-400"}
                          />
                        </button>

                        <button
                          onClick={(e) => handleDownload(e, song)}
                          title="Tải về"
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition"
                        >
                          <CircleEllipsis size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Music size={32} className="text-gray-600 mb-2" />
                    <p className="font-semibold text-base text-gray-300">Không tìm thấy bài hát nào phù hợp.</p>
                    <p className="text-xs text-gray-500">Hãy thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {!loading && totalSongs > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[#1c1c1c] border-t border-[#282828] text-xs text-gray-400">
            <div>
              Đang xem <span className="text-white font-bold">{startIndex}</span> -{" "}
              <span className="text-white font-bold">{endIndex}</span> trong{" "}
              <span className="text-white font-bold">{totalSongs}</span> bài hát
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                title="Trang đầu"
                className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Trang trước"
                className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg font-bold transition text-xs ${
                        currentPage === p
                          ? "bg-[#1DB954] text-black shadow-md scale-105"
                          : "border border-[#333] hover:bg-[#282828] hover:text-white text-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-gray-500">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Trang sau"
                className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                title="Trang cuối"
                className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default AllSongs;