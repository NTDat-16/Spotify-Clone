import React, { useState, useEffect } from "react";
import { API_ORIGIN } from "../../../config/api";
import { PlayIcon, CircleEllipsis, Heart, Tv, Sparkles, Flame, Disc, Radio, DownloadCloud, ChevronLeft, ChevronRight } from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount, Song } from "../../../AudioContext";
import { useNavigate } from "react-router-dom";
import { getLovedSongs, toggleLovedSong } from "../../../services/favorites";
import { getAudioUrl, getImageUrl, formatDuration } from "../../../utils/media";
import { getSpotifyNewReleases } from "../../../services/spotify";
import CatalogImportModal from "../../CatalogImportModal";

interface Album {
  id: number;
  name: string;
  cover_image: string;
  artist_name: string;
}

const Home: React.FC = () => {
  const { handlePlaySong, setSongList } = useAudio();
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [chartPage, setChartPage] = useState<number>(1);
  const CHART_PAGE_SIZE = 10;
  const [spotifyReleases, setSpotifyReleases] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [lovedIds, setLovedIds] = useState<Set<string>>(() => new Set(getLovedSongs().map((s) => String(s.id))));
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchTopSongs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_ORIGIN}/api/songs/?ordering=-play_count`);
      if (!response.ok) throw new Error("Không thể tải bảng xếp hạng.");
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);

      const mappedSongs: Song[] = list.map((song: any) => ({
        id: song.id,
        name: song.name || "Unknown Song",
        artist: song.artist_name || (typeof song.artist === "string" ? song.artist : "Unknown Artist"),
        album: song.album_name || null,
        duration: song.duration || 180,
        song_url: song.song_url || "",
        image_url: getImageUrl(song.image_url || song.album_img || song.cover_image),
        premium: song.premium || 0,
        source: (song.song_url ? "local" : "spotify") as any,
      }));

      setTopSongs(mappedSongs);
      setSongList(mappedSongs);
    } catch (err) {
      setError("Đã xảy ra lỗi khi tải danh sách bài hát.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch(`${API_ORIGIN}/api/albums/`);
      if (!response.ok) throw new Error("Không thể tải danh sách album.");
      const data = await response.json();
      setAlbums(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách album:", err);
    }
  };

  const fetchSpotifyReleases = async () => {
    try {
      const releases = await getSpotifyNewReleases();
      setSpotifyReleases(releases);
    } catch (err) {
      console.error("Lỗi khi tải gợi ý từ Spotify:", err);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setLovedIds(new Set(getLovedSongs().map((s) => String(s.id))));
    };
    const handleCatalogRefresh = () => {
      fetchTopSongs();
      fetchAlbums();
      fetchSpotifyReleases();
    };

    window.addEventListener("loved-songs-updated", handleUpdate);
    window.addEventListener("catalog-updated", handleCatalogRefresh);

    fetchAlbums();
    fetchTopSongs();
    fetchSpotifyReleases();

    return () => {
      window.removeEventListener("loved-songs-updated", handleUpdate);
      window.removeEventListener("catalog-updated", handleCatalogRefresh);
    };
  }, [setSongList]);

  const handleDownload = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bạn cần tài khoản Premium để tải bài hát này.");
      return;
    }
    const songUrl = getAudioUrl(song.song_url);
    if (!songUrl) {
      alert("Bài hát này phát trực tuyến qua Spotify & YouTube Player.");
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
      alert("Không thể tải bài hát này.");
    };
    xhr.send();
  };

  const handleNavigateToAlbum = (albumId: number) => {
    navigate(`/viewalbum/${albumId}`);
  };

  // Lời chào theo thời gian
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  // Phân loại các album đặc biệt của Tam Thái Tử
  const featuredJackAlbum =
    albums.find((a) => a.name.toLowerCase() === "tam thái tử") ||
    albums.find((a) => a.name.toLowerCase().includes("tam thái tử")) ||
    albums[0];

  const featuredAlbums = albums.filter((alb) =>
    alb.name.toLowerCase().includes("tam thái tử") ||
    alb.name.toLowerCase().includes("chúng ta của tương lai") ||
    alb.name.toLowerCase().includes("ai cũng phải bắt đầu") ||
    alb.name.toLowerCase().includes("22 & đẹp") ||
    alb.name.toLowerCase().includes("loichoi")
  );

  const quickPicks = albums.slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 bg-[#121212] text-white p-3 sm:p-6 pb-32 min-h-screen max-w-7xl mx-auto">
      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>
      )}

      {/* 1. Spotify Spotlight Hero Banner - Album Tam Thái Tử (Jack - J97) */}
      {featuredJackAlbum && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-950 via-[#261c14] to-[#121212] border border-amber-600/30 p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 group">
          <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold tracking-wider uppercase">
              <Sparkles size={14} className="animate-spin text-amber-400" />
              Album Mới Ra Mắt • Jack - J97
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {featuredJackAlbum.name}
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
              Album phòng thu chính thức từ nam ca sĩ Jack (J97) với 11 ca khúc mới mang âm hưởng ngũ cung dân gian kết hợp synth-wave hiện đại: <span className="text-amber-300 font-medium">Hoa Trong Đá, Người Dưng, Hào Hoa, Tam Thái Tử, Lưu Niên...</span>
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 pt-2">
              <button
                onClick={() => handleNavigateToAlbum(featuredJackAlbum.id)}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#1DB954] text-black font-bold flex items-center gap-2 hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition shadow-lg shadow-green-950 text-xs sm:text-sm"
              >
                <PlayIcon size={18} className="fill-current" />
                Khám Phá Album
              </button>
              <button
                onClick={() => {
                  const tamThaiTuSong = topSongs.find((s) => s.name.toLowerCase().includes("tam thái tử")) || topSongs[0];
                  if (tamThaiTuSong) {
                    handlePlaySong(tamThaiTuSong, true);
                  }
                }}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 backdrop-blur border border-white/10 transition hover:scale-105 text-xs sm:text-sm"
              >
                <Tv size={16} className="text-[#1DB954]" />
                Xem MV "Tam Thái Tử"
              </button>
            </div>
          </div>

          <div
            className="w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 cursor-pointer group-hover:scale-105 transition-transform duration-300 border-2 border-amber-500/30"
            onClick={() => handleNavigateToAlbum(featuredJackAlbum.id)}
          >
            <img
              src={getImageUrl(featuredJackAlbum.cover_image)}
              alt={featuredJackAlbum.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/default-cover.png";
              }}
            />
          </div>
        </div>
      )}

      {/* Catalog Expand Promo Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#18231c] to-[#121212] border border-emerald-500/30 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] flex-shrink-0">
            <DownloadCloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                Mở rộng kho nhạc tự động
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#1DB954] text-black">
                {topSongs.length} bài hát hiện có
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Bạn thấy kho nhạc ít? Nạp thêm hàng trăm bài hit mới nhất: Top V-Pop, Rap Việt, US-UK, K-Pop chỉ với 1 cú click!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1DB954] text-black text-xs font-black uppercase tracking-wide hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition shadow-lg shadow-green-950 flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Sparkles size={15} />
          <span>Nạp Thêm Bài Hát</span>
        </button>
      </div>

      {/* 2. Quick Access Cards (Chào buổi sáng / Buổi tối) */}
      <section>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight flex items-center gap-2">
          {greeting}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPicks.map((alb) => (
            <div
              key={alb.id}
              onClick={() => handleNavigateToAlbum(alb.id)}
              className="flex items-center bg-[#242424]/60 hover:bg-[#303030] rounded-md overflow-hidden transition-all duration-200 group cursor-pointer shadow border border-white/5"
            >
              <img
                src={getImageUrl(alb.cover_image)}
                alt={alb.name}
                className="w-16 h-16 object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = "/default-cover.png";
                }}
              />
              <span className="font-semibold text-sm px-4 truncate flex-1 text-white">
                {alb.name}
              </span>
              <button
                className="h-10 w-10 mr-4 rounded-full bg-[#1DB954] text-black opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 shadow-lg hover:scale-105"
                title="Phát album"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToAlbum(alb.id);
                }}
              >
                <PlayIcon size={20} className="fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Section Đặc Biệt: Album Tam Thái Tử & Top Albums */}
      {featuredAlbums.length > 0 && (
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-600 text-black">
                  HOT ALBUMS
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Album Tam Thái Tử (Jack - J97) & Top Albums
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Các album nổi bật nhất: "Tam Thái Tử" - Jack J97, "Chúng Ta Của Tương Lai", "Ai Cũng Phải Bắt Đầu Từ Đâu Đó"...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featuredAlbums.map((album) => (
              <div
                key={album.id}
                className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between border border-transparent hover:border-white/10 shadow"
                onClick={() => handleNavigateToAlbum(album.id)}
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 shadow-md">
                  <img
                    src={getImageUrl(album.cover_image)}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/default-cover.png";
                    }}
                  />
                  <button
                    className="absolute bottom-3 right-3 h-11 w-11 bg-[#1DB954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl hover:scale-105"
                    title="Mở album"
                  >
                    <PlayIcon size={22} className="fill-current ml-0.5" />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition" title={album.name}>
                    {album.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1" title={album.artist_name}>
                    {album.artist_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Khám phá từ Spotify Catalog & Video MV */}
      {spotifyReleases.length > 0 && (
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1DB954] text-black flex items-center gap-1">
                  <Radio size={12} />
                  Spotify Web API
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Mới Phát Hành Trên Spotify & MV
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Phát trực tuyến các ca khúc mới nhất qua Spotify Web API và YouTube Player API
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {spotifyReleases.map((item) => (
              <div
                key={item.id}
                className="bg-[#181818] p-3 rounded-xl hover:bg-[#282828] transition-all group cursor-pointer flex flex-col justify-between border border-transparent hover:border-white/5"
                onClick={() => {
                  setSongList(spotifyReleases);
                  handlePlaySong(item, false);
                }}
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/default-cover.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSongList(spotifyReleases);
                        handlePlaySong(item, false);
                      }}
                      title="Phát nhạc"
                      className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-110 transition shadow-lg"
                    >
                      <PlayIcon size={20} className="ml-0.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSongList(spotifyReleases);
                        handlePlaySong(item, true);
                      }}
                      title="Xem MV (YouTube)"
                      className="w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:scale-110 hover:bg-white/40 transition"
                    >
                      <Tv size={16} />
                    </button>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate text-white group-hover:text-[#1DB954] transition" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1" title={item.artist}>
                    {item.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Bảng xếp hạng âm nhạc 2024 - 2026 */}
      <section className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-amber-500" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Bảng Xếp Hạng Bài Hát Mới Nhất
              </h2>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Top các ca khúc được nghe nhiều nhất và hỗ trợ stream trực tuyến
            </p>
          </div>
          <button
            onClick={() => navigate("/all_songs")}
            className="text-xs font-bold text-[#1DB954] hover:underline self-start sm:self-auto"
          >
            Xem tất cả {topSongs.length > 0 ? `(${topSongs.length} bài hát)` : ""} →
          </button>
        </div>
        <div className="bg-[#181818] rounded-xl overflow-hidden border border-[#282828] shadow-xl">
          {isLoading ? (
            <p className="p-8 text-center text-gray-400">Đang tải bảng xếp hạng...</p>
          ) : topSongs.length === 0 ? (
            <p className="p-8 text-center text-gray-400">Không có bài hát nào trong bảng xếp hạng.</p>
          ) : (
            <>
              <div className="divide-y divide-[#282828]/60">
                {topSongs
                  .slice((chartPage - 1) * CHART_PAGE_SIZE, chartPage * CHART_PAGE_SIZE)
                  .map((song, index) => {
                    const songIsPremium = isPremiumSong(song);
                    const isLoved = lovedIds.has(String(song.id));
                    const rank = (chartPage - 1) * CHART_PAGE_SIZE + index + 1;
                    return (
                      <div
                        key={song.id}
                        className="flex items-center p-2.5 sm:p-3.5 hover:bg-[#282828] transition-all cursor-pointer group"
                        onClick={() => {
                          if (songIsPremium && !isUserPremiumAccount()) {
                            alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
                            return;
                          }
                          setSongList(topSongs);
                          handlePlaySong(song, false);
                        }}
                      >
                        <span
                          className={`w-7 sm:w-10 text-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                            rank === 1
                              ? "text-yellow-400 text-sm sm:text-base"
                              : rank === 2
                              ? "text-gray-300 text-sm sm:text-base"
                              : rank === 3
                              ? "text-amber-600 text-sm sm:text-base"
                              : "text-gray-500"
                          }`}
                        >
                          #{rank}
                        </span>
                        <div className="flex items-center flex-1 min-w-0 pr-2 sm:pr-4">
                          <div className="relative group/cover flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 mr-2.5 sm:mr-3 rounded-lg overflow-hidden shadow bg-[#222]">
                            <img
                              src={song.image_url}
                              alt={song.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              onError={(e) => {
                                e.currentTarget.src = "/default-cover.png";
                              }}
                            />
                            <button className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayIcon size={16} className="text-[#1DB954] fill-current" />
                            </button>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <h3 className="font-semibold text-xs sm:text-sm truncate text-white group-hover:text-[#1DB954] transition">
                                {song.name}
                              </h3>
                              {songIsPremium && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white flex-shrink-0">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">{song.artist}</p>
                          </div>
                        </div>

                        <div className="w-24 text-xs text-gray-400 text-center hidden md:block">
                          {song.album || "Single"}
                        </div>

                        <div className="w-12 sm:w-16 text-xs text-gray-400 text-right tabular-nums pr-2 sm:pr-4 font-mono">
                          {formatDuration(song.duration)}
                        </div>

                        <div className="flex items-center justify-end gap-0.5 sm:gap-1 flex-shrink-0">
                          <button
                            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#333] transition"
                            title="Xem MV (YouTube)"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongList(topSongs);
                              handlePlaySong(song, true);
                            }}
                          >
                            <Tv size={15} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#333] transition"
                            title={isLoved ? "Xóa khỏi yêu thích" : "Yêu thích"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLovedSong(song as any);
                            }}
                          >
                            <Heart
                              size={15}
                              className={isLoved ? "fill-[#1DB954] text-[#1DB954]" : "text-gray-400"}
                            />
                          </button>
                          <button
                            className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-[#333] transition hidden sm:inline-flex"
                            title="Tải về"
                            onClick={(e) => handleDownload(e, song)}
                          >
                            <CircleEllipsis size={17} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Phân trang Section 5 */}
              {topSongs.length > CHART_PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 bg-[#1f1f1f] border-t border-[#282828] text-xs text-gray-400">
                  <span>
                    Trang <span className="text-white font-bold">{chartPage}</span> /{" "}
                    <span className="text-white font-bold">{Math.ceil(topSongs.length / CHART_PAGE_SIZE)}</span> ({topSongs.length} bài hát)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setChartPage((p) => Math.max(1, p - 1))}
                      disabled={chartPage === 1}
                      title="Trang trước"
                      className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from(
                      { length: Math.min(5, Math.ceil(topSongs.length / CHART_PAGE_SIZE)) },
                      (_, i) => {
                        const maxP = Math.ceil(topSongs.length / CHART_PAGE_SIZE);
                        let p = i + 1;
                        if (chartPage > 3 && maxP > 5) {
                          p = Math.min(chartPage - 2 + i, maxP - (4 - i));
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setChartPage(p)}
                            className={`min-w-[28px] h-7 px-1.5 rounded-md font-bold text-xs transition ${
                              chartPage === p
                                ? "bg-[#1DB954] text-black shadow"
                                : "border border-[#333] hover:bg-[#282828] text-gray-300"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() =>
                        setChartPage((p) =>
                          Math.min(Math.ceil(topSongs.length / CHART_PAGE_SIZE), p + 1)
                        )
                      }
                      disabled={chartPage === Math.ceil(topSongs.length / CHART_PAGE_SIZE)}
                      title="Trang sau"
                      className="p-1.5 rounded-lg border border-[#333] hover:bg-[#282828] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 6. Danh Sách Tất Cả Albums */}
      <section className="pt-2">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight flex items-center gap-2">
          <Disc size={22} className="text-[#1DB954]" />
          Tất Cả Albums
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-[#181818] rounded-xl p-4 transition-all hover:bg-[#282828] cursor-pointer group flex flex-col justify-between border border-transparent hover:border-white/5"
              onClick={() => handleNavigateToAlbum(album.id)}
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 shadow">
                <img
                  src={getImageUrl(album.cover_image)}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/default-cover.png";
                  }}
                />
                <button className="absolute bottom-3 right-3 h-11 w-11 bg-[#1DB954] rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl hover:scale-105">
                  <PlayIcon size={22} className="fill-current ml-0.5" />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-sm truncate text-white group-hover:text-[#1DB954] transition" title={album.name}>
                  {album.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-1">{album.artist_name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CatalogImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Home;