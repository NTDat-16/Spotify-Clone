import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { Song } from "../AudioContext";

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  image_url: string;
  song_url: string;
  premium: number;
  source: "spotify" | "local";
  spotify_id?: string;
  external_url?: string;
}

export const searchSpotifyTracks = async (query: string): Promise<Song[]> => {
  if (!query || !query.trim()) return [];
  try {
    const response = await axios.get(`${API_BASE_URL}/external/spotify/search/`, {
      params: { q: query.trim() },
    });
    const tracks: SpotifyTrack[] = response.data?.tracks || [];
    return tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      album: t.album,
      duration: t.duration || 210,
      song_url: t.song_url || "",
      image_url: t.image_url || "/default-cover.png",
      premium: 0,
      source: "spotify" as const,
      spotify_id: t.spotify_id,
    }));
  } catch (error) {
    console.error("Lỗi khi tìm kiếm trên Spotify Web API:", error);
    return [];
  }
};

export const getSpotifyNewReleases = async (): Promise<Song[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/external/spotify/new-releases/`);
    const tracks: SpotifyTrack[] = response.data?.tracks || [];
    return tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      album: t.album,
      duration: t.duration || 210,
      song_url: t.song_url || "",
      image_url: t.image_url || "/default-cover.png",
      premium: 0,
      source: "spotify" as const,
      spotify_id: t.spotify_id,
    }));
  } catch (error) {
    console.error("Lỗi khi tải gợi ý từ Spotify Web API:", error);
    return [];
  }
};

export const saveExternalSong = async (song: Song): Promise<any | null> => {
  try {
    const res = await axios.post(`${API_BASE_URL}/external/save-song/`, {
      name: song.name,
      artist: song.artist,
      album: song.album || "",
      image_url: song.image_url || "",
      duration: song.duration || 210,
      premium: song.premium || 0,
    });
    return res.data?.song || null;
  } catch (error) {
    console.error("Lỗi khi lưu bài hát vào thư viện:", error);
    return null;
  }
};
