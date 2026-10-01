export interface GeminiChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  songs?: Array<{
    name: string;
    artist: string;
  }>;
}

export const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

const getGeminiEndpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Bạn là Spotify AI Music DJ - Trợ lý âm nhạc thông minh đẳng cấp hàng đầu trên Spotify Clone.
Nhiệm vụ của bạn là tư vấn, trò chuyện thân thiện và đề xuất những bài hát tuyệt vời nhất cho người dùng dựa trên tâm trạng, sở thích, ca sĩ, thể loại hoặc hoàn cảnh (học bài, làm việc, tập gym, thất tình, du lịch, tiệc tùng...).

Đặc biệt, bạn am hiểu rất sâu về:
- Album "Tam Thái Tử" của Jack - J97 (album phòng thu đầu tay gồm 11 ca khúc: Hoa Trong Đá, Người Dưng, Anh Yêu Em, Lưu Niên, Nếu Phải Giữ Cho Em, Mỗi Lần Nhớ Em Là Một Ngày Mưa, Nát Tan Cõi Lòng, Hào Hoa, Thì Ra Mình Đã Yêu Nhau Xong Rồi, Hướng Dương Bất Tức, Tam Thái Tử).
- Các nghệ sĩ V-Pop đình đám: Sơn Tùng M-TP, Jack - J97, HIEUTHUHAI, MONO, Wren Evans, AMEE, ERIK, Dương Domic, Bùi Trường Linh, Phan Mạnh Quỳnh...
- Các ca khúc US-UK, K-Pop và nhạc quốc tế thịnh hành (như Bruno Mars, ROSÉ, Taylor Swift, Billie Eilish, Sabrina Carpenter, Lady Gaga...).

QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
Khi bạn đề xuất bất kỳ bài hát nào, HÃY LUÔN ĐỊNH DẠNG CHÍNH XÁC theo mẫu sau trên 1 dòng riêng:
🎵 **[Tên bài hát]** - [Tên ca sĩ / nghệ sĩ]
(Ví dụ: 🎵 **Tam Thái Tử** - Jack - J97 hoặc 🎵 **Đừng Làm Trái Tim Anh Đau** - Sơn Tùng M-TP)
Kèm theo 1 câu ngắn gọn giải thích vì sao bài hát này phù hợp.

Nhờ định dạng này, ứng dụng sẽ tự động hiển thị nút "Phát ngay" và "Xem MV" để người nghe thưởng thức trực tiếp!`;

/**
 * Trích xuất danh sách bài hát từ nội dung phản hồi của Gemini
 */
export const extractSongsFromText = (
  text: string
): Array<{ name: string; artist: string }> => {
  const songs: Array<{ name: string; artist: string }> = [];
  const seen = new Set<string>();

  // Regex nhận diện các mẫu:
  // 🎵 **Tên bài hát** - Tên nghệ sĩ
  // **Tên bài hát** - Tên nghệ sĩ
  // 1. **Tên bài hát** - Tên ca sĩ
  const regex = /(?:🎵\s*)?(?:\d+\.\s*)?\*\*([^*]+)\*\*\s*(?:-|–|by)\s*([^\n:–\-]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawName = match[1].replace(/^[🎵\s\d\.]+/, "").trim();
    const rawArtist = match[2].replace(/[–\-\:\*]/g, "").trim();

    if (rawName && rawArtist && rawName.length < 60 && rawArtist.length < 60) {
      const key = `${rawName.toLowerCase()}_${rawArtist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        songs.push({ name: rawName, artist: rawArtist });
      }
    }
  }

  return songs;
};

/**
 * Gửi yêu cầu trò chuyện tới Gemini API với tính năng thử lại (retry) khi gặp lỗi tạm thời
 */
export const askGeminiMusicAI = async (
  conversationHistory: Array<{ role: "user" | "model"; text: string }>,
  newUserMessage: string
): Promise<string> => {
  // Chuẩn bị payload contents
  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: `${SYSTEM_PROMPT}\n\nNgười dùng bắt đầu trò chuyện:` }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Xin chào! Mình là Spotify AI Music DJ của bạn. Hôm nay bạn đang có tâm trạng thế nào, hoặc muốn mình gợi ý bản hit gì nào? Hãy chia sẻ với mình nhé! 🎧✨",
        },
      ],
    },
  ];

  // Thêm lịch sử hội thoại gần nhất (tối đa 6 lượt)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  }

  // Thêm tin nhắn mới nhất của người dùng
  contents.push({
    role: "user",
    parts: [{ text: newUserMessage }],
  });

  const bodyData = { contents };

  if (!GEMINI_API_KEY) {
    return "⚠️ Trợ lý AI chưa được định cấu hình API key. Vui lòng thiết lập biến môi trường `VITE_GEMINI_API_KEY` trong file `.env` (hoặc Vercel Settings) để bắt đầu sử dụng!";
  }

  // Thực hiện gọi API với cơ chế retry tối đa 3 lần
  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(getGeminiEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 && retries < 2) {
          retries++;
          await new Promise((r) => setTimeout(r, 1200 * retries));
          continue;
        }
        throw new Error(
          errorData?.error?.message || `Lỗi Gemini API: ${response.status}`
        );
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      const text = part?.text;

      if (!text) {
        throw new Error("Không nhận được câu trả lời từ AI.");
      }

      return text;
    } catch (err: any) {
      if (retries >= 2) {
        console.error("Lỗi khi gọi Gemini AI:", err);
        return `Xin lỗi bạn, Spotify AI DJ đang gặp chút trục trặc kết nối (${err.message}). Bạn có thể thử lại sau giây lát hoặc hỏi về các hit của Sơn Tùng, HIEUTHUHAI, MONO nhé!`;
      }
      retries++;
      await new Promise((r) => setTimeout(r, 1000 * retries));
    }
  }

  return "Rất tiếc, AI chưa thể phản hồi lúc này. Vui lòng thử lại!";
};
