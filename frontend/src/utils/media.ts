/**
 * Helper to resolve audio and media URLs.
 * Audio files are stored statically in frontend/public/audio/ to avoid serverless payload limits.
 * Also supports external URLs (Cloudinary, S3, Firebase, etc.).
 */
export const getAudioUrl = (songUrl?: string | null): string => {
  if (!songUrl) return "";
  if (songUrl.startsWith("http://") || songUrl.startsWith("https://")) {
    return songUrl;
  }
  const clean = songUrl.replace(/^\/+/, "");
  if (clean.startsWith("audio/")) {
    return `/${clean}`;
  }
  return `/audio/${clean}`;
};

export const getImageUrl = (imgUrl?: string | null): string => {
  if (!imgUrl) return "/default-cover.png";
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://") || imgUrl.startsWith("data:")) {
    return imgUrl;
  }
  const clean = imgUrl.replace(/^\/+/, "");
  if (clean.startsWith("uploads/albums/")) {
    return `/${clean}`;
  }
  return `/uploads/albums/${clean}`;
};

export const formatDuration = (seconds?: number | null): string => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
