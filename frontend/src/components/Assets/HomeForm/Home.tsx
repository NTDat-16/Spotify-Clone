import React, { useState, useEffect } from "react";
import { API_ORIGIN } from "../../../config/api";
import { PlayIcon, CircleEllipsis, Heart, Tv } from "lucide-react";
import { useAudio, isPremiumSong, isUserPremiumAccount, Song } from "../../../AudioContext";
import { useNavigate } from "react-router-dom";
import { getLovedSongs, toggleLovedSong } from "../../../services/favorites";
import { getAudioUrl } from "../../../utils/media";
import { getSpotifyNewReleases } from "../../../services/spotify";

interface Album {
  id: number;
  name: string;
  cover_image: string;
  artist_name: string;
}

const Home: React.FC = () => {
  const { handlePlaySong, setSongList } = useAudio();
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [spotifyReleases, setSpotifyReleases] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [lovedIds, setLovedIds] = useState<Set<string>>(() => new Set(getLovedSongs().map((s) => String(s.id))));

  useEffect(() => {
    const handleUpdate = () => {
      setLovedIds(new Set(getLovedSongs().map((s) => String(s.id))));
    };
    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, []);

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
        const response = await fetch(`${API_ORIGIN}/api/songs/?ordering=-play_count`);
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
        const response = await fetch(`${API_ORIGIN}/api/albums/`);
        if (!response.ok) throw new Error("Không thể tải danh sách album.");
        const data = await response.json();
        // const filteredAlbums = data.filter((album: any) => album.songs && album.songs.length > 0);
        setAlbums(data);
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách album.");
        console.error(err);
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

    fetchAlbums();
    fetchTopSongs();
    fetchSpotifyReleases();
  }, [setSongList]);

  const handleDownload = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bạn cần tài khoản Premium để tải bài hát này.");
      return;
    }
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
      {/* Khám phá Spotify Catalog & Video MV */}
      {spotifyReleases.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1DB954] text-black">
                  Spotify
                </span>
                <h2 className="text-2xl md:text-3xl font-bold">Khám phá từ Spotify & Video MV</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Phát trực tuyến nhạc mới qua Spotify Web API và YouTube Player API
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {spotifyReleases.map((item) => (
              <div
                key={item.id}
                className="bg-[#181818] p-3 rounded-lg hover:bg-[#282828] transition-all group cursor-pointer flex flex-col justify-between"
                onClick={() => {
                  setSongList(spotifyReleases);
                  handlePlaySong(item, false);
                }}
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3">
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
              {topSongs.map((song, index) => {
                const songIsPremium = isPremiumSong(song);
                return (
                  <div
                    key={song.id}
                    className="flex items-center p-4 hover:bg-[#282828] transition-all cursor-pointer"
                    onClick={() => {
                      if (songIsPremium && !isUserPremiumAccount()) {
                        alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
                        return;
                      }
                      handlePlaySong(song);
                    }}
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
                          {songIsPremium && (
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
                  <div className="w-24 text-center flex items-center justify-center gap-3">
                    <button
                      className="text-gray-400 hover:text-white transition p-1"
                      title={lovedIds.has(song.id) ? "Xóa khỏi yêu thích" : "Yêu thích"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLovedSong(song);
                      }}
                    >
                      <Heart
                        size={18}
                        className={lovedIds.has(song.id) ? "fill-[#1DB954] text-[#1DB954]" : "text-gray-400 hover:text-white"}
                      />
                    </button>
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                      title="Tải về"
                      onClick={(e) => handleDownload(e, song)}
                    >
                      <CircleEllipsis size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;