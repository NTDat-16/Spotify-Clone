import React, { useState, useEffect, useCallback } from "react";
import { useAudio, isPremiumSong } from "../AudioContext";
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
  ClockIcon,
  MicIcon,
  Heart,
  Tv,
  Loader2,
} from "lucide-react";
import SleepTimer from "./SleepTimer";
import LyricsModal from "./LyricsModal";
import { isSongLoved, toggleLovedSong } from "../services/favorites";

const MusicPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    currentTime,
    duration,
    setSongList,
    songList,
    volume,
    setVolume,
    isMvMode,
    toggleMvMode,
    playbackSource,
    isLoadingExternal,
  } = useAudio();

  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [originalSongList, setOriginalSongList] = useState(songList);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showLyric, setShowLyric] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isLoved, setIsLoved] = useState(false);

  useEffect(() => {
    if (currentSong) {
      setIsLoved(isSongLoved(currentSong.id));
    }
  }, [currentSong]);

  useEffect(() => {
    const handleUpdate = () => {
      if (currentSong) {
        setIsLoved(isSongLoved(currentSong.id));
      }
    };
    window.addEventListener("loved-songs-updated", handleUpdate);
    return () => window.removeEventListener("loved-songs-updated", handleUpdate);
  }, [currentSong]);

  // Âm lượng được đồng bộ tự động qua AudioContext (HTML5 Audio + YouTube Player)

  // Đếm ngược thời gian hẹn giờ
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (timerRemaining !== null && timerRemaining > 0) {
      intervalId = setInterval(() => {
        setTimerRemaining((prev) => (prev !== null ? prev - 1 : prev));
      }, 1000);
    } else if (timerRemaining === 0) {
      togglePlayPause(); // Tạm dừng khi hẹn giờ hết
      setTimerRemaining(null);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerRemaining, togglePlayPause]);

  // Hàm xử lý khi thiết lập hẹn giờ
  const handleTimerSet = (minutes: number) => {
    setTimerRemaining(minutes * 60);
  };

  // Hàm xử lý khi dừng hẹn giờ
  const handleTimerStop = () => {
    setTimerRemaining(null);
  };

  // Hàm xử lý shuffle
  const handleShuffle = useCallback(() => {
    if (!isShuffled) {
      setOriginalSongList(songList);
      const shuffledList = [...songList].sort(() => Math.random() - 0.5);
      setSongList(shuffledList);
      setIsShuffled(true);
    } else {
      setSongList(originalSongList);
      setIsShuffled(false);
    }
  }, [isShuffled, songList, setSongList, originalSongList]);

  // Hàm xử lý lặp lại
  const handleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off"
    );
  }, []);

  // Hàm xử lý tua bài hát
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (duration && Number.isFinite(duration)) {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width > 0) {
          const clickPosition = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width)
          );
          const newTime = clickPosition * duration;
          seek(newTime);
        }
      }
    },
    [duration, seek]
  );

  // Hàm xử lý thay đổi âm lượng
  const handleVolumeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0) {
        const clickPosition = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        setVolume(clickPosition);
      }
    },
    [setVolume]
  );

  // Định dạng thời gian (MM:SS)
  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  // Định dạng thời gian đếm ngược
  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return "";
    return formatTime(seconds);
  };

  if (!currentSong) return null;

  const isCurrentSongPremium = isPremiumSong(currentSong);
  const progressPercent =
    duration > 0 && Number.isFinite(duration) && Number.isFinite(currentTime)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;
  const volumePercent = Math.min(100, Math.max(0, volume * 100));

  return (
    <div className="h-20 bg-[#181818] border-t border-[#282828] px-4 flex items-center justify-between text-white relative w-full overflow-hidden select-none">
      {/* Thông tin bài hát */}
      <div className="w-1/4 min-w-[200px] max-w-[320px] flex items-center gap-3 flex-shrink-0">
        <img
          src={currentSong.image_url}
          alt={currentSong.name}
          className="h-12 w-12 rounded object-cover flex-shrink-0 shadow-md"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/default-cover.png";
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate" title={currentSong.name}>
              {currentSong.name}
            </h4>
            {currentSong.source === "spotify" && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1DB954] text-black flex-shrink-0"
                title="Phát qua Spotify Catalog & YouTube Player"
              >
                Spotify
              </span>
            )}
            {isCurrentSongPremium && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white flex-shrink-0">
                Premium
              </span>
            )}
            {isLoadingExternal && (
              <span
                className="text-[10px] text-yellow-400 flex items-center gap-1 flex-shrink-0"
                title="Đang nạp video YouTube..."
              >
                <Loader2 size={11} className="animate-spin" />
              </span>
            )}
          </div>
          <p
            className="text-xs text-gray-400 truncate"
            title={currentSong.artist}
          >
            {currentSong.artist}
          </p>
        </div>
        <button
          onClick={() => {
            if (currentSong) {
              const newState = toggleLovedSong(currentSong);
              setIsLoved(newState);
            }
          }}
          title={isLoved ? "Xóa khỏi bài hát yêu thích" : "Lưu vào bài hát yêu thích"}
          className="text-gray-400 hover:text-white transition flex-shrink-0"
        >
          <Heart
            size={18}
            className={
              isLoved
                ? "fill-[#1DB954] text-[#1DB954]"
                : "text-gray-400 hover:text-white"
            }
          />
        </button>
      </div>

      {/* Điều khiển phát nhạc (ở giữa) */}
      <div className="flex-1 max-w-2xl min-w-0 px-4 flex flex-col items-center justify-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleShuffle}
            title={isShuffled ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên"}
            className={`${
              isShuffled ? "text-green-500" : "text-gray-400"
            } hover:text-white transition`}
          >
            <ShuffleIcon size={18} />
          </button>
          <button
            onClick={playPrevious}
            title="Bài trước đó"
            className="text-gray-400 hover:text-white transition"
          >
            <SkipBackIcon size={20} />
          </button>
          <button
            onClick={togglePlayPause}
            title={isPlaying ? "Tạm dừng" : "Phát"}
            className="h-10 w-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:bg-[#1ed760] hover:scale-105 transition active:scale-95 shadow-md"
          >
            {isPlaying ? (
              <PauseIcon size={22} />
            ) : (
              <PlayIcon size={22} className="ml-0.5" />
            )}
          </button>
          <button
            onClick={playNext}
            title="Bài kế tiếp"
            className="text-gray-400 hover:text-white transition"
          >
            <SkipForwardIcon size={20} />
          </button>
          <button
            onClick={handleRepeat}
            title={`Lặp lại: ${repeatMode}`}
            className={`${
              repeatMode !== "off" ? "text-green-500" : "text-gray-400"
            } hover:text-white transition relative`}
          >
            <RepeatIcon size={18} />
            {repeatMode === "one" && (
              <span className="absolute text-[10px] -mt-2 ml-4 bg-green-500 text-black font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Thanh tiến độ nghe */}
        <div className="w-full mt-2 flex items-center gap-2">
          <span className="text-[11px] text-gray-400 w-10 text-right tabular-nums flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bg-[#282828] hover:h-1.5 rounded-full cursor-pointer relative overflow-hidden group transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-400 w-10 text-left tabular-nums flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Điều khiển âm lượng, MV, lời bài hát và hẹn giờ */}
      <div className="w-1/4 min-w-[200px] max-w-[320px] flex justify-end items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMvMode}
            title={isMvMode ? "Thu nhỏ cửa sổ MV" : "Xem MV / Video (YouTube)"}
            className={`p-1.5 rounded transition ${
              isMvMode
                ? "text-[#1DB954] bg-[#282828]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Tv size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLyric(true)}
            title="Xem lời bài hát"
            className="text-gray-400 hover:text-white transition p-1.5"
          >
            <MicIcon size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSleepTimer(true)}
            title="Hẹn giờ ngủ"
            className="text-gray-400 hover:text-white transition"
          >
            <ClockIcon size={18} />
          </button>
          {timerRemaining !== null && (
            <span className="text-[11px] text-green-400 font-mono">
              {formatTimer(timerRemaining)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <VolumeIcon size={16} className="text-gray-400 flex-shrink-0" />
          <div
            className="w-24 h-1 hover:h-1.5 bg-[#282828] rounded-full cursor-pointer relative overflow-hidden group transition-all"
            onClick={handleVolumeChange}
          >
            <div
              className="h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-all"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
        </div>
      </div>

      {showSleepTimer && (
        <SleepTimer
          onClose={() => setShowSleepTimer(false)}
          onTimerSet={handleTimerSet}
          onTimerStop={handleTimerStop}
        />
      )}

      {showLyric && (
        <LyricsModal
          isOpen={showLyric}
          onClose={() => setShowLyric(false)}
          songId={currentSong.id}
        />
      )}
    </div>
  );
};

export default MusicPlayer;