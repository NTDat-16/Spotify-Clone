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
    <div className="p-6 text-white pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
        <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart size={80} className="text-white fill-white drop-shadow-md" />
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
            Playlist
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold my-2">Bài hát đã thích</h1>
          <p className="text-sm text-gray-300">
            {lovedSongs.length} bài hát
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {lovedSongs.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handlePlayAll}
            className="px-6 py-3 bg-[#1DB954] text-black font-semibold rounded-full flex items-center gap-2 hover:bg-[#1ed760] transition hover:scale-105 active:scale-95 shadow-lg"
          >
            <PlayIcon size={20} className="fill-black" />
            Phát tất cả
          </button>
        </div>
      )}

      {/* Song List */}
      {lovedSongs.length === 0 ? (
        <div className="bg-[#181818] rounded-xl p-12 text-center border border-[#282828] mt-4">
          <div className="w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center mx-auto mb-4 text-[#1DB954]">
            <Heart size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Chưa có bài hát yêu thích nào</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
            Nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào để lưu vào danh sách yêu thích của bạn.
          </p>
          <Link
            to="/all_songs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ed760] transition"
          >
            <Music size={18} />
            Khám phá bài hát ngay
          </Link>
        </div>
      ) : (
        <div className="bg-[#181818] rounded-lg overflow-hidden border border-[#282828]">
          <table className="w-full">
            <thead className="bg-[#222] text-left border-b border-[#282828]">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Album
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                  <div className="flex items-center gap-1">
                    <Clock3Icon size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828]">
              {lovedSongs.map((song, index) => (
                <tr
                  key={song.id}
                  className="hover:bg-[#282828] cursor-pointer transition group"
                  onClick={() => handlePlayOne(song)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <PlayIcon size={16} className="hidden group-hover:inline text-white fill-white" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={song.image_url || "/default-cover.png"}
                        alt={song.name}
                        className="h-10 w-10 rounded object-cover mr-3 bg-gray-800"
                        onError={(e) => {
                          e.currentTarget.src = "/default-cover.png";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate max-w-xs flex items-center gap-2">
                          {song.name}
                          {isPremiumSong(song) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">{song.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                    {song.album || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDuration(song.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-gray-400 hover:text-red-500 transition p-1"
                      title="Xóa khỏi danh sách yêu thích"
                      onClick={(e) => handleRemove(e, song.id)}
                    >
                      <Trash2Icon size={18} />
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