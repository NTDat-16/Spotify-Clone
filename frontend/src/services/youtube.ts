import axios from "axios";
import { API_BASE_URL } from "../config/api";

export interface YouTubeSearchResult {
  video_id: string;
  embed_url: string;
  watch_url: string;
  thumbnail_url: string;
}

// In-memory cache for fast videoId resolution
const ytCache = new Map<string, YouTubeSearchResult>();

export const getYouTubeVideoForSong = async (
  name: string,
  artist: string
): Promise<YouTubeSearchResult | null> => {
  const cacheKey = `${name.toLowerCase().trim()}_${artist.toLowerCase().trim()}`;
  if (ytCache.has(cacheKey)) {
    return ytCache.get(cacheKey)!;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/external/youtube/search/`, {
      params: {
        name: name.trim(),
        artist: artist.trim(),
      },
    });

    const data: YouTubeSearchResult = response.data;
    if (data?.video_id) {
      ytCache.set(cacheKey, data);
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Không thể tìm video YouTube cho "${name} - ${artist}":`, error);
    return null;
  }
};
