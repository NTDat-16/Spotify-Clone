import React, { useState, useEffect, useCallback } from "react";
import { useAudio } from "../AudioContext";
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
} from "lucide-react";
import SleepTimer from "./SleepTimer";
import LyricsModal from "./LyricsModal";

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
  } = useAudio();

  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [volume, setVolume] = useState(() => {
    return Number(localStorage.getItem("volume")) || 0.75;
  });
  const [originalSongList, setOriginalSongList] = useState(songList);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showLyric, setShowLyric] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  // Lưu âm lượng vào localStorage và cập nhật audio
  useEffect(() => {
    localStorage.setItem("volume", volume.toString());
    const audio = document.querySelector("audio");
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Xử lý khi bài hát kết thúc
  useEffect(() => {
    const audio = document.querySelector("audio");
    if (!audio) {
      return;
    }

    const handleEnded = () => {
      console.log("Song ended, repeatMode:", repeatMode); // Debug
      if (repeatMode === "one") {
        seek(0);
        audio.play().catch((err) => console.error("Error replaying song:", err));
      } else if (repeatMode === "all") {
        playNext();
      } else {
        const currentIndex = songList.findIndex(
          (song) => song.id === currentSong?.id
        );
        if (currentIndex < songList.length - 1) {
          playNext();
        } else {
          togglePlayPause();
        }
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, repeatMode, songList, playNext, seek, togglePlayPause]);

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
      if (duration) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const newTime = clickPosition * duration;
        seek(newTime);
      }
    },
    [duration, seek]
  );

  // Hàm xử lý thay đổi âm lượng
  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, clickPosition));
    setVolume(newVolume);
  }, []);

  // Định dạng thời gian (MM:SS)
  const formatTime = (time: number) => {
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

  return (
    <div className="h-20 bg-[#181818] border-t border-[#282828] px-4 flex items-center text-white relative">
      {/* Thông tin bài hát */}
      <div className="w-1/4 flex items-center gap-3">
        <img
          src={currentSong.image_url}
          alt={currentSong.name}
          className="h-12 w-12 rounded object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/default-cover.png";
          }}
        />
        <div>
          <h4 className="text-sm font-medium">{currentSong.name}</h4>
          <p className="text-xs text-gray-400">{currentSong.artist}</p>
        </div>
      </div>

      {/* Điều khiển phát nhạc */}
      <div className="w-2/4 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleShuffle}
            className={`${
              isShuffled ? "text-green-500" : "text-gray-400"
            } hover:text-white transition`}
          >
            <ShuffleIcon size={18} />
          </button>
          <button
            onClick={playPrevious}
            className="text-gray-400 hover:text-white transition"
          >
            <SkipBackIcon size={20} />
          </button>
          <button
            onClick={togglePlayPause}
            className="h-10 w-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:bg-[#1ed760] transition"
          >
            {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </button>
          <button
            onClick={playNext}
            className="text-gray-400 hover:text-white transition"
          >
            <SkipForwardIcon size={20} />
          </button>
          <button
            onClick={handleRepeat}
            className={`${
              repeatMode !== "off" ? "text-green-500" : "text-gray-400"
            } hover:text-white transition relative`}
          >
            <RepeatIcon size={18} />
            {repeatMode === "one" && (
              <span className="absolute text-xs -mt-2 ml-4 bg-green-500 rounded-full h-4 w-4 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>
        <div className="w-full mt-2 flex items-center gap-3">
          <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-[#282828] rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Điều khiển âm lượng và hẹn giờ */}
      <div className="w-1/4 flex justify-end items-center gap-2">
      <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLyric(true)}
            className="text-gray-400 hover:text-white transition"
          >
            <MicIcon size={18} />
          </button>
          {timerRemaining !== null && (
            <span className="text-xs text-gray-400">{formatTimer(timerRemaining)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSleepTimer(true)}
            className="text-gray-400 hover:text-white transition"
          >
            <ClockIcon size={18} />
          </button>
          {timerRemaining !== null && (
            <span className="text-xs text-gray-400">{formatTimer(timerRemaining)}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <VolumeIcon size={16} className="text-gray-400" />
          <div
            className="w-24 h-1 bg-[#282828] rounded-full cursor-pointer"
            onClick={handleVolumeChange}
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${volume * 100}%` }}
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
          songId={currentSong?.id || 0}
          onClose={() => setShowLyric(false)}
        />
      )}
    </div>
  );
};

export default MusicPlayer;