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
