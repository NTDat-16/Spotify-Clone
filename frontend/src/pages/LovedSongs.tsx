import React, { useState, useEffect } from "react";
import { PlayIcon, Clock3Icon, Trash2Icon, Heart, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { useAudio, isPremiumSong, isUserPremiumAccount } from "../AudioContext";
import { getLovedSongs, removeLovedSong, LovedSong } from "../services/favorites";

const LovedSongs: React.FC = () => {
  const [lovedSongs, setLovedSongs] = useState<LovedSong[]>([]);
  const { handlePlaySong, setSongList } = useAudio();

  useEffect(() => {
    setLovedSongs(getLovedSongs());

    const handleUpdate = (e: any) => {
      setLovedSongs(e.detail || getLovedSongs());
    };

    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, []);

  const handlePlayAll = () => {
    if (lovedSongs.length === 0) return;
    const isUserPremium = isUserPremiumAccount();
    const firstPlayableSong = isUserPremium
      ? lovedSongs[0]
      : lovedSongs.find((s) => !isPremiumSong(s));
    if (firstPlayableSong) {
      setSongList(lovedSongs as any);
      handlePlaySong(firstPlayableSong as any);
    } else {
      alert("Tất cả bài hát yêu thích đều yêu cầu tài khoản Premium!");
    }
  };

  const handlePlayOne = (song: LovedSong) => {
    if (isPremiumSong(song) && !isUserPremiumAccount()) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
      return;
    }
    setSongList(lovedSongs as any);
    handlePlaySong(song as any);
  };

  const handleRemove = (e: React.MouseEvent, songId: number | string) => {
    e.stopPropagation();
    removeLovedSong(songId);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-3 sm:p-6 text-white pb-32 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8 text-center sm:text-left">
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart className="text-white fill-white drop-shadow-md w-12 h-12 sm:w-20 sm:h-20" />
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold my-1 sm:my-2">Bài hát đã thích</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            {lovedSongs.length} bài hát
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {lovedSongs.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handlePlayAll}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#1DB954] text-black font-bold rounded-full flex items-center gap-2 hover:bg-[#1ed760] transition hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
          >
            <PlayIcon size={18} className="fill-black" />
            <span>Phát tất cả</span>
          </button>
        </div>
      )}

      {/* Song List */}
      {lovedSongs.length === 0 ? (
        <div className="bg-[#181818] rounded-xl p-8 sm:p-12 text-center border border-[#282828] mt-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#282828] flex items-center justify-center mx-auto mb-4 text-[#1DB954]">
            <Heart size={28} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Chưa có bài hát yêu thích nào</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6 text-xs sm:text-sm">
            Nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào để lưu vào danh sách yêu thích của bạn.
          </p>
          <Link
            to="/all_songs"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ed760] transition text-xs sm:text-sm"
          >
            <Music size={18} />
            Khám phá bài hát ngay
          </Link>
        </div>
      ) : (
        <div className="bg-[#181818] rounded-xl overflow-x-auto border border-[#282828] shadow-xl">
          <table className="w-full">
            <thead className="bg-[#222] text-left border-b border-[#282828]">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-8 sm:w-12 text-center">
                  #
                </th>
                <th className="px-3 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Album
                </th>
                <th className="px-3 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-20 sm:w-24">
                  <div className="flex items-center gap-1">
                    <Clock3Icon size={14} />
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-14 sm:w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]">
              {lovedSongs.map((song, index) => (
                <tr
                  key={song.id}
                  className="hover:bg-[#282828] cursor-pointer transition group"
                  onClick={() => handlePlayOne(song)}
                >
                  <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm text-gray-400 text-center">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <PlayIcon size={15} className="hidden group-hover:inline text-[#1DB954] fill-[#1DB954]" />
                  </td>
                  <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={song.image_url || "/default-cover.png"}
                        alt={song.name}
                        className="h-10 w-10 rounded-lg object-cover mr-3 bg-gray-800 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/default-cover.png";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs flex items-center gap-2 group-hover:text-[#1DB954] transition">
                          {song.name}
                          {isPremiumSong(song) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white flex-shrink-0">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-400 truncate max-w-[140px] sm:max-w-xs">{song.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-400 hidden md:table-cell">
                    {song.album || "—"}
                  </td>
                  <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-xs text-gray-400 tabular-nums font-mono">
                    {formatDuration(song.duration)}
                  </td>
                  <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                    <button
                      className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-[#333]"
                      title="Xóa khỏi danh sách yêu thích"
                      onClick={(e) => handleRemove(e, song.id)}
                    >
                      <Trash2Icon size={16} />
                    </button>
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

export default LovedSongs;