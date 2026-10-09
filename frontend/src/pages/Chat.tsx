import React, { useState, useRef, useEffect } from "react";
import { API_ORIGIN } from "../config/api";
import {
  SendIcon,
  UserIcon,
  SearchIcon,
  Sparkles,
  Play,
  Tv,
  Heart,
  Bot,
  Trash2,
  Music2,
  Flame,
  ChevronLeft,
} from "lucide-react";
import { useAudio, Song } from "../AudioContext";
import { askGeminiMusicAI, extractSongsFromText } from "../services/gemini";
import { toggleLovedSong, isSongLoved } from "../services/favorites";
import { getImageUrl } from "../utils/media";

interface Users {
  id: number;
  username: string;
  email: string;
  status: number;
  unread?: boolean;
  isAi?: boolean;
}

interface Message {
  id: number | string;
  user: string;
  content: string;
  time: string;
  isCurrentUser: boolean;
  songs?: Array<{ name: string; artist: string }>;
}

const AI_BOT_USER: Users = {
  id: -999,
  username: "Spotify AI Music DJ",
  email: "ai@spotify.gemini",
  status: 1,
  isAi: true,
};

const DEFAULT_AI_MESSAGES: Message[] = [
  {
    id: "ai_welcome",
    user: "Spotify AI DJ",
    content:
      "Xin chào! Mình là **Spotify AI Music DJ** (được cung cấp bởi Google Gemini). Hãy chia sẻ với mình tâm trạng hiện tại, thể loại yêu thích hoặc hoàn cảnh của bạn, mình sẽ đề xuất ngay những bản hit phù hợp nhất! 🎧✨\n\nBạn có thể thử bấm vào các gợi ý nhanh bên dưới nhé:",
    time: "Vừa xong",
    isCurrentUser: false,
    songs: [
      { name: "Tam Thái Tử", artist: "Jack - J97" },
      { name: "Hoa Trong Đá", artist: "Jack - J97" },
      { name: "Đừng Làm Trái Tim Anh Đau", artist: "Sơn Tùng M-TP" },
    ],
  },
];

const QUICK_PROMPTS = [
  { label: "👑 Album Tam Thái Tử (Jack - J97)", prompt: "Gợi ý các ca khúc hay nhất trong album phòng thu Tam Thái Tử của nam ca sĩ Jack - J97" },
  { label: "🎧 Nhạc chill học bài", prompt: "Gợi ý danh sách nhạc chill, lofi, acoustic thư giãn nhẹ nhàng để học bài và tập trung làm việc" },
  { label: "💔 Tình ca buồn sâu lắng", prompt: "Tôi đang buồn và thất tình, hãy gợi ý cho tôi những bản ballad tâm trạng xúc động nhất" },
  { label: "⚡ Nhạc gym beat căng", prompt: "Gợi ý nhạc rap / hiphop sôi động, beat căng tràn đầy năng lượng để tập gym và chạy bộ" },
  { label: "🔥 Top Trending 2025", prompt: "Gợi ý các bài hát đang trending hot nhất trên bảng xếp hạng âm nhạc hiện nay" },
];

const Chat: React.FC = () => {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Users | null>(AI_BOT_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [listUser, setListUsers] = useState<Users[]>([]);
  const [userMessages, setUserMessages] = useState<{ [key: string]: Message[] }>({});
  const [aiMessages, setAiMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem("spotify_ai_chat_history");
      return stored ? JSON.parse(stored) : DEFAULT_AI_MESSAGES;
    } catch {
      return DEFAULT_AI_MESSAGES;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [lovedSet, setLovedSet] = useState<Set<string>>(() => new Set());
  const [showMobileUsers, setShowMobileUsers] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { handlePlaySong, setSongList, currentSong, isPlaying } = useAudio();
  const [dbSongs, setDbSongs] = useState<any[]>([]);
  const [autoPlayToast, setAutoPlayToast] = useState<{
    name: string;
    artist: string;
    isMv: boolean;
  } | null>(null);

  // Tải danh sách bài hát từ hệ thống để đồng bộ ảnh bìa và metadata
  useEffect(() => {
    fetch(`${API_ORIGIN}/api/songs/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbSongs(data);
        }
      })
      .catch((err) => console.warn("Lỗi tải db songs:", err));
  }, []);

  const syncLovedState = () => {
    try {
      const raw = localStorage.getItem("spotify_loved_songs");
      if (raw) {
        const arr = JSON.parse(raw);
        setLovedSet(new Set(arr.map((s: any) => `${s.name?.toLowerCase()}_${s.artist?.toLowerCase()}`)));
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

  // Lưu lịch sử chat AI
  useEffect(() => {
    try {
      localStorage.setItem("spotify_ai_chat_history", JSON.stringify(aiMessages));
    } catch {
      // ignore
    }
  }, [aiMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedUser, userMessages, aiMessages]);

  useEffect(() => {
    if (selectedUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserEmail = currentUser?.email;
  const currentUserId = currentUser?.id;

  // Lấy danh sách user từ backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_ORIGIN}/api/users/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) return;

        const data: Users[] = await response.json();
        const filteredData = data
          .filter((user) => user.email !== currentUserEmail)
          .map((user) => ({ ...user, unread: false }));
        setListUsers(filteredData);
      } catch (err) {
        console.error("Lỗi khi tải danh sách users:", err);
      }
    };

    fetchUsers();
  }, [currentUserEmail]);

  // Lấy tin nhắn người dùng (khi chat với user thông thường)
  const fetchMessages = async () => {
    if (!selectedUser || selectedUser.isAi || !currentUserId) return;

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/messages/?sender_id=${currentUserId}&receiver_id=${selectedUser.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const messages: Message[] = data.map((msg: any) => {
        const senderId = Number(msg.sender);
        const isCurrentUser = senderId === Number(currentUserId);
        return {
          id: msg.id,
          content: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCurrentUser,
          user: isCurrentUser ? "Tôi" : selectedUser.username,
        };
      });

      setUserMessages((prev) => ({
        ...prev,
        [selectedUser.email]: messages,
      }));
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (selectedUser && !selectedUser.isAi) {
      fetchMessages();
    }
  }, [selectedUser, currentUserId]);

  // Xử lý gửi tin nhắn AI
  const handleSendAiMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const newMsg: Message = {
      id: `u_${Date.now()}`,
      user: "Bạn",
      content: userText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCurrentUser: true,
    };

    const updatedHistory = [...aiMessages, newMsg];
    setAiMessages(updatedHistory);
    setMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // Chuyển đổi định dạng cho Gemini
      const conversationHistory = updatedHistory.map((m) => ({
        role: m.isCurrentUser ? ("user" as const) : ("model" as const),
        text: m.content,
      }));

      const reply = await askGeminiMusicAI(conversationHistory, userText.trim());
      const extractedSongs = extractSongsFromText(reply);

      const aiReplyMsg: Message = {
        id: `ai_${Date.now()}`,
        user: "Spotify AI DJ",
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCurrentUser: false,
        songs: extractedSongs,
      };

      setAiMessages((prev) => [...prev, aiReplyMsg]);

      // QUYỀN TỰ ĐỘNG PHÁT: Khi người dùng yêu cầu mở/bật/phát/nghe/play bài hát -> Tự động phát ngay lập tức
      const playKeywords = /(mở|bật|phát|nghe|play|chơi|xem\s*mv|mở\s*mv|bật\s*mv|phát\s*mv|bật\s*nhạc|mở\s*nhạc|phát\s*nhạc|cho\s*nghe)/i;
      const isPlayIntent = playKeywords.test(userText);
      const isMvIntent = /(mv|video|xem\s*mv|mở\s*mv|bật\s*mv|phát\s*mv)/i.test(userText);

      if (isPlayIntent && extractedSongs.length > 0) {
        const topSong = extractedSongs[0];
        handlePlayRecommendedSong(topSong.name, topSong.artist, isMvIntent);
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      setError("Không thể kết nối tới Spotify AI DJ. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý gửi tin nhắn người dùng
  const handleSendUserMessage = async (userText: string) => {
    if (!userText.trim() || !selectedUser || !currentUserId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_ORIGIN}/api/send_message/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content: userText.trim(),
        }),
      });

      if (response.ok) {
        await fetchMessages();
        setMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (selectedUser?.isAi) {
      handleSendAiMessage(message);
    } else {
      handleSendUserMessage(message);
    }
  };

  const handlePlayRecommendedSong = (
    songName: string,
    artistName: string,
    forceMv: boolean = false
  ) => {
    // 1. Đối soát trong database để lấy bìa album và dữ liệu chính thức
    const normSearchName = songName.toLowerCase().trim();
    const matched = dbSongs.find((s) => {
      const sName = (s.name || "").toLowerCase().trim();
      return (
        sName === normSearchName ||
        sName.includes(normSearchName) ||
        normSearchName.includes(sName)
      );
    });

    const songObj: Song = matched
      ? {
          id: matched.id,
          name: matched.name,
          artist: matched.artist_name || matched.artist?.name || artistName,
          album: matched.album_name || matched.album?.name || "Album",
          duration: matched.duration || 210,
          song_url: matched.song_url || "",
          image_url: matched.album_img
            ? getImageUrl(matched.album_img)
            : "/default-cover.png",
          premium: matched.premium || 0,
          source: matched.song_url ? "local" : "spotify",
        }
      : {
          id: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: songName,
          artist: artistName,
          album: "Gợi ý từ Spotify AI DJ",
          duration: 210,
          song_url: "", // Phân giải tự động qua YouTube IFrame API
          image_url: "/default-cover.png",
          premium: 0,
          source: "spotify",
        };

    setSongList([songObj]);
    handlePlaySong(songObj, forceMv);
    setAutoPlayToast({
      name: songObj.name,
      artist: songObj.artist,
      isMv: forceMv,
    });
    setTimeout(() => setAutoPlayToast(null), 6000);
  };

  const handleClearAiChat = () => {
    if (window.confirm("Bạn có muốn làm mới cuộc trò chuyện với Spotify AI DJ?")) {
      setAiMessages(DEFAULT_AI_MESSAGES);
      localStorage.removeItem("spotify_ai_chat_history");
    }
  };

  const filteredUsers = listUser.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100dvh-176px)] md:h-[calc(100vh-140px)] flex bg-[#121212] overflow-hidden select-none">
      {/* Cột danh sách người dùng & Bot bên trái */}
      <div className={`w-full md:w-80 bg-[#181818] border-r border-[#282828] flex-col ${showMobileUsers ? "flex" : "hidden md:flex"}`}>
        <div className="p-4 border-b border-[#282828]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Tin nhắn & Trợ lý</span>
              <span className="text-xs text-gray-400 font-normal">
                ({filteredUsers.length})
              </span>
            </h3>
            {selectedUser && (
              <button
                type="button"
                onClick={() => setShowMobileUsers(false)}
                className="md:hidden text-xs text-[#1DB954] hover:underline font-bold"
              >
                Vào chat →
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full pl-9 pr-4 py-2 bg-[#242424] border border-[#333] rounded-full text-xs text-white placeholder-gray-400 focus:ring-1 focus:ring-[#1DB954] outline-none transition"
            />
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Danh sách người trò chuyện */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Mục đặc biệt: Spotify AI Music DJ */}
          <div
            onClick={() => {
              setSelectedUser(AI_BOT_USER);
              setShowMobileUsers(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              selectedUser?.isAi
                ? "bg-gradient-to-r from-emerald-950/80 to-[#1DB954]/20 border-[#1DB954]/50 shadow-md"
                : "bg-[#202020]/60 hover:bg-[#282828] border-emerald-500/20"
            }`}
          >
            <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-[#1DB954] to-teal-700 flex items-center justify-center text-black shadow-lg flex-shrink-0">
              <Sparkles size={20} className="text-black animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-[#181818]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  Spotify AI DJ
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1DB954] text-black font-extrabold">
                    AI
                  </span>
                </span>
              </div>
              <p className="text-xs text-emerald-400 truncate mt-0.5">
                Đề xuất nhạc & MV với Gemini ✨
              </p>
            </div>
          </div>

          <div className="pt-2 pb-1 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Bạn bè & Người dùng
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              Không tìm thấy người dùng phù hợp.
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setShowMobileUsers(false);
                }}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                  selectedUser?.id === user.id
                    ? "bg-[#282828] text-white"
                    : "hover:bg-[#202020] text-gray-300"
                }`}
              >
                <div className="relative h-9 w-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 flex-shrink-0">
                  <UserIcon size={18} />
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#181818] ${
                      user.status === 1 ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate block">
                    {user.username}
                  </span>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cửa sổ chat bên phải */}
      <div className={`flex-1 flex flex-col bg-[#121212] ${showMobileUsers ? "hidden md:flex" : "flex"}`}>
        {selectedUser ? (
          <>
            {/* Header phòng chat */}
            <div className="p-3 sm:p-4 border-b border-[#282828] bg-[#181818] flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMobileUsers(true)}
                  className="md:hidden p-1.5 rounded-lg bg-[#282828] hover:bg-[#333] text-gray-300 hover:text-white transition flex items-center gap-1 text-xs flex-shrink-0"
                  title="Danh sách đoạn chat"
                >
                  <ChevronLeft size={16} />
                  <span className="font-semibold">Danh sách</span>
                </button>

                {selectedUser.isAi ? (
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[#1DB954] to-teal-800 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Bot size={20} className="text-black" />
                  </div>
                ) : (
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 flex-shrink-0">
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-bold text-white flex items-center gap-2 truncate">
                    <span className="truncate">{selectedUser.username}</span>
                    {selectedUser.isAi && (
                      <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 font-semibold flex-shrink-0">
                        Gemini 3.8
                      </span>
                    )}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                    {selectedUser.isAi
                      ? "Trợ lý âm nhạc 24/7 • Đề xuất theo tâm trạng, ca sĩ, hoàn cảnh"
                      : selectedUser.email}
                  </p>
                </div>
              </div>

              {selectedUser.isAi && (
                <button
                  onClick={handleClearAiChat}
                  title="Xóa lịch sử chat AI"
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#282828] rounded-lg transition text-xs flex items-center gap-1.5"
                >
                  <Trash2 size={15} />
                  <span className="hidden sm:inline">Làm mới chat</span>
                </button>
              )}
            </div>

            {/* Quick Prompt Chips (chỉ dành cho AI chat) */}
            {selectedUser.isAi && (
              <div className="px-4 py-2.5 bg-[#161616] border-b border-[#242424] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Flame size={13} className="text-amber-400" />
                  Gợi ý nhanh:
                </span>
                {QUICK_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAiMessage(chip.prompt)}
                    disabled={isLoading}
                    className="px-3 py-1 rounded-full text-xs bg-[#242424] hover:bg-[#303030] text-gray-300 hover:text-white border border-[#333] transition flex-shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Nội dung tin nhắn */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="text-red-400 bg-red-950/40 border border-red-900/50 p-3 rounded-lg text-xs text-center">
                  {error}
                </div>
              )}

              {selectedUser.isAi ? (
                // Tin nhắn AI
                aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-lg ${
                        msg.isCurrentUser
                          ? "bg-[#1DB954] text-black font-medium"
                          : "bg-[#1c1c1c] text-gray-200 border border-[#2e2e2e]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-75">
                        <span className="font-bold flex items-center gap-1">
                          {!msg.isCurrentUser && <Sparkles size={12} className="text-[#1DB954]" />}
                          {msg.user}
                        </span>
                        <span>{msg.time}</span>
                      </div>

                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      {/* Hiển thị các thẻ bài hát gợi ý có nút phát ngay */}
                      {!msg.isCurrentUser && msg.songs && msg.songs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#333] space-y-2">
                          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Music2 size={13} />
                            Bài hát được đề xuất — Bấm để nghe ngay:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {msg.songs.map((song, sIdx) => {
                              const lovedKey = `${song.name.toLowerCase()}_${song.artist.toLowerCase()}`;
                              const isLoved = lovedSet.has(lovedKey);
                              const isCurrentlyPlaying =
                                isPlaying &&
                                currentSong?.name?.toLowerCase().trim() ===
                                  song.name.toLowerCase().trim();

                              return (
                                <div
                                  key={sIdx}
                                  className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 group ${
                                    isCurrentlyPlaying
                                      ? "bg-[#132a1c] border-[#1DB954] shadow-md shadow-green-950/50"
                                      : "bg-[#262626] hover:bg-[#303030] border-[#383838]"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <h4
                                      className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                                        isCurrentlyPlaying
                                          ? "text-[#1DB954]"
                                          : "text-white"
                                      }`}
                                      title={song.name}
                                    >
                                      {isCurrentlyPlaying && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-ping flex-shrink-0" />
                                      )}
                                      {song.name}
                                    </h4>
                                    <p
                                      className="text-[11px] text-gray-400 truncate mt-0.5"
                                      title={song.artist}
                                    >
                                      {song.artist}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handlePlayRecommendedSong(song.name, song.artist, false)}
                                      title="Phát bài này"
                                      className="p-1.5 rounded-md bg-[#1DB954] text-black hover:scale-105 active:scale-95 transition shadow"
                                    >
                                      <Play size={13} className="fill-current ml-0.5" />
                                    </button>
                                    <button
                                      onClick={() => handlePlayRecommendedSong(song.name, song.artist, true)}
                                      title="Xem MV (YouTube)"
                                      className="p-1.5 rounded-md bg-[#333] text-gray-300 hover:text-white hover:bg-[#444] transition"
                                    >
                                      <Tv size={13} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        toggleLovedSong({
                                          id: `ai_${song.name}_${song.artist}`,
                                          name: song.name,
                                          artist: song.artist,
                                          album: "Spotify AI DJ",
                                          duration: 210,
                                          song_url: "",
                                          image_url: "/default-cover.png",
                                        });
                                      }}
                                      title={isLoved ? "Đã thích" : "Lưu vào yêu thích"}
                                      className="p-1.5 rounded-md bg-[#333] text-gray-300 hover:text-white hover:bg-[#444] transition"
                                    >
                                      <Heart
                                        size={13}
                                        className={isLoved ? "fill-[#1DB954] text-[#1DB954]" : ""}
                                      />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Tin nhắn giữa người dùng
                userMessages[selectedUser.email]?.length > 0 ? (
                  userMessages[selectedUser.email].map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 shadow ${
                          msg.isCurrentUser
                            ? "bg-blue-600 text-white"
                            : "bg-[#222] text-gray-200 border border-[#333]"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="text-[10px] mt-1 opacity-70 text-right">{msg.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                  </div>
                )
              )}

              {/* Trạng thái AI đang suy nghĩ */}
              {isLoading && selectedUser.isAi && (
                <div className="flex justify-start">
                  <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl p-3.5 shadow-lg flex items-center gap-2.5 text-xs text-gray-300">
                    <Sparkles size={16} className="text-[#1DB954] animate-spin" />
                    <span>Spotify DJ đang tìm bài hát hoàn hảo cho bạn...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Thanh thông báo tự động phát nhạc bởi AI DJ */}
            {autoPlayToast && selectedUser.isAi && (
              <div className="bg-gradient-to-r from-emerald-950/90 via-[#181818] to-[#121212] border-t border-emerald-500/40 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-white flex-shrink-0">🎧 AI DJ đang phát:</span>
                  <span className="truncate text-emerald-200 font-medium">
                    {autoPlayToast.name} - {autoPlayToast.artist}
                  </span>
                  {autoPlayToast.isMv && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold flex-shrink-0 ml-1">
                      MV
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium ml-2 flex-shrink-0 flex items-center gap-1">
                  Đang phát trực tiếp ✨
                </span>
              </div>
            )}

            {/* Ô nhập tin nhắn */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-[#282828] bg-[#181818]"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    selectedUser.isAi
                      ? "Ra lệnh cho AI: 'Mở bài Tam Thái Tử', 'Phát nhạc Sơn Tùng', 'Xem MV Hoa Trong Đá'..."
                      : "Nhập tin nhắn..."
                  }
                  className="flex-1 px-4 py-2.5 bg-[#242424] border border-[#333] rounded-full text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#1DB954] outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className={`px-5 py-2.5 rounded-full font-bold flex items-center justify-center gap-1.5 transition ${
                    selectedUser.isAi
                      ? "bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-green-950/40"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <SendIcon size={16} />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Chọn một người dùng hoặc Spotify AI DJ để bắt đầu trò chuyện
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;