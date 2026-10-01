import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAudio } from "../AudioContext";
import {
  ExternalLink,
  Minimize2,
  Maximize2,
  Tv,
  Loader2,
  X,
} from "lucide-react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface YouTubePlayerProps {
  onPlayerReady?: (player: any) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = () => {
  const {
    currentSong,
    playbackSource,
    activeVideoId,
    isPlaying,
    isMvMode,
    setMvMode,
    toggleMvMode,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    playNext,
    isLoadingExternal,
    registerYtPlayer,
  } = useAudio();

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState<boolean>(Boolean(window.YT && window.YT.Player));
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Tải YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      setIsApiReady(true);
    };
  }, []);

  // 2. Khởi tạo YT.Player khi API sẵn sàng
  useEffect(() => {
    if (!isApiReady || playerRef.current) return;

    try {
      const player = new window.YT.Player("youtube-player-mount", {
        height: "100%",
        width: "100%",
        videoId: activeVideoId || "",
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            registerYtPlayer(event.target);
            event.target.setVolume(Math.round(volume * 100));
            if (activeVideoId && playbackSource === "youtube") {
              event.target.loadVideoById(activeVideoId);
              if (isPlaying) {
                event.target.playVideo();
              }
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const dur = event.target.getDuration();
              if (dur && Number.isFinite(dur)) {
                setDuration(dur);
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              playNext();
            }
          },
          onError: (err: any) => {
            console.error("YouTube Player Error:", err);
          },
        },
      });
    } catch (e) {
      console.error("Lỗi khởi tạo YouTube Player:", e);
    }
  }, [isApiReady]);

  // 3. Khi activeVideoId thay đổi
  useEffect(() => {
    if (!playerRef.current || !activeVideoId) return;
    if (playbackSource === "youtube") {
      try {
        playerRef.current.loadVideoById({
          videoId: activeVideoId,
          startSeconds: 0,
        });
        playerRef.current.setVolume(Math.round(volume * 100));
        playerRef.current.playVideo();
      } catch (err) {
        console.error("Lỗi khi tải video YouTube:", err);
      }
    }
  }, [activeVideoId, playbackSource]);

  // 4. Đồng bộ âm lượng
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(Math.round(volume * 100));
    }
  }, [volume]);

  // 5. Cập nhật currentTime và duration theo nhịp 250ms khi đang phát YouTube
  useEffect(() => {
    if (playbackSource !== "youtube" || !isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const curTime = playerRef.current.getCurrentTime();
          const totalDur = playerRef.current.getDuration();
          if (Number.isFinite(curTime)) {
            setCurrentTime(curTime);
          }
          if (Number.isFinite(totalDur) && totalDur > 0) {
            setDuration(totalDur);
          }
        } catch {
          // ignore
        }
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playbackSource, isPlaying, setCurrentTime, setDuration]);

  // Đóng MV dock nhưng vẫn giữ âm thanh phát nền nếu bài hát nguồn là YouTube
  const handleMinimize = useCallback(() => {
    setMvMode(false);
  }, [setMvMode]);

  const watchUrl = activeVideoId
    ? `https://www.youtube.com/watch?v=${activeVideoId}`
    : "#";

  return (
    <>
      {/* 
        Container IFrame luôn nằm trong DOM để YouTube không bị trình duyệt ngắt audio.
        Khi isMvMode = false: định vị ngoài màn hình (opacity thấp) để phát nhạc ngầm mượt mà.
        Khi isMvMode = true: hiển thị thành Dock Video PiP nổi đẹp mắt ở góc dưới bên phải.
      */}
      <div
        ref={containerRef}
        style={
          isMvMode && activeVideoId
            ? {
                position: "fixed",
                bottom: "90px",
                right: "20px",
                zIndex: 49,
              }
            : {
                position: "fixed",
                bottom: "-9999px",
                right: "-9999px",
                width: "280px",
                height: "160px",
                opacity: 0.001,
                pointerEvents: "none",
                zIndex: -1,
              }
        }
        className={
          isMvMode && activeVideoId
            ? `${
                isExpanded ? "w-[560px] max-w-[90vw]" : "w-80 md:w-96"
              } bg-[#181818] border border-[#333] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col`
            : ""
        }
      >
        {/* Header của Mini Video Dock khi mở */}
        {isMvMode && activeVideoId && (
          <div className="bg-[#242424] px-3 py-2 flex items-center justify-between text-xs text-gray-300 border-b border-[#333] select-none">
            <div className="flex items-center gap-2 truncate pr-2">
              <Tv size={15} className="text-[#1DB954] flex-shrink-0 animate-pulse" />
              <span className="font-semibold text-white truncate">
                {currentSong ? `${currentSong.name} - ${currentSong.artist}` : "Đang phát video"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isLoadingExternal && (
                <Loader2 size={14} className="animate-spin text-green-400 mr-1" />
              )}
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở trên YouTube"
                className="hover:text-white transition p-1 hover:bg-[#333] rounded"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Thu nhỏ kích thước" : "Mở rộng kích thước"}
                className="hover:text-white transition p-1 hover:bg-[#333] rounded"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={handleMinimize}
                title="Thu nhỏ thành chế độ chỉ nghe audio"
                className="hover:text-white transition p-1 hover:bg-[#333] rounded text-gray-400 hover:text-red-400"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Video Player Frame Container */}
        <div
          className={
            isMvMode && activeVideoId
              ? "relative aspect-video w-full bg-black overflow-hidden"
              : "w-full h-full"
          }
        >
          <div id="youtube-player-mount" className="w-full h-full" />
        </div>
      </div>
    </>
  );
};

export default YouTubePlayer;
