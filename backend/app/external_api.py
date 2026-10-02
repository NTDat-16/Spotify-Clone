import os
import re
import time
import base64
import urllib.parse
import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# In-memory cache for Spotify Access Token
_spotify_token_cache = {
    "token": None,
    "expires_at": 0
}

def get_spotify_access_token():
    """
    Obtains Spotify Access Token using Client Credentials flow.
    Caches token until expiration.
    """
    global _spotify_token_cache
    client_id = getattr(settings, "SPOTIFY_CLIENT_ID", "") or os.getenv("SPOTIFY_CLIENT_ID", "")
    client_secret = getattr(settings, "SPOTIFY_CLIENT_SECRET", "") or os.getenv("SPOTIFY_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        return None

    now = time.time()
    if _spotify_token_cache["token"] and _spotify_token_cache["expires_at"] > now + 60:
        return _spotify_token_cache["token"]

    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    try:
        response = requests.post(url, headers=headers, data=data, timeout=8)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)
            _spotify_token_cache["token"] = token
            _spotify_token_cache["expires_at"] = now + expires_in
            return token
    except Exception as e:
        print(f"Error fetching Spotify token: {e}")

    return None


import unicodedata

_yt_video_cache = {}

KNOWN_TRACK_VIDEOS = {
    "tam thai tu": "bL5IuLDBuDQ",
    "hoa trong da": "FNbT75NoaAI",
    "nguoi dung": "vLa5jvCJMGk",
    "hao hoa": "boKJ5XDs_mY",
    "anh yeu em": "qM9woZ4i36Q",
    "luu nien": "4wKKL7wXIdw",
    "neu phai giu cho em": "vLa5jvCJMGk",
    "moi lan nho em la mot ngay mua": "boKJ5XDs_mY",
    "nat tan coi long": "FNbT75NoaAI",
    "thi ra minh da yeu nhau xong roi": "qM9woZ4i36Q",
    "huong duong bat tuc": "4wKKL7wXIdw",
    "thien ly oi": "OrDB4jpA1g8",
    "dom dom": "4zH5iYM4wJo",
    "hoa hai duong": "mPVDGOVjRQ0",
    "song gio": "SEsMhb74jTI",
    "chung ta cua tuong lai": "zoEtcR5EW08",
    "dung lam trai tim anh dau": "abPmZCZZrFA",
    "nang am xa dan": "488ceQWoGGw",
    "con mua ngang qua": "q_4p53rU-7c",
    "em cua ngay hom qua": "knW7-x7Y7RE",
    "tai sinh": "y1b_XWp9n-s",
    "noi nay co anh": "FN7ALfpGxiI",
    "lac troi": "Llw9Q6akRo4",
    "waiting for you": "yZ1bM_Z555A",
    "khong the say": "o3nZ_XwzVwY",
    "hen gap em duoi anh trang": "N8qjAwbvR5c",
    "tung quen": "E_1YvA0z9L0",
    "thang tu la loi noi doi cua em": "zP2sO4zV7-E",
    "chua bao gio": "m9W_H4mB4tU",
}

def _normalize_title(text):
    if not text:
        return ""
    normalized = unicodedata.normalize('NFD', text)
    stripped = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', '', stripped.lower()).strip()

def _format_cover_image(cover_image):
    if not cover_image:
        return "/default-cover.png"
    cover_str = str(cover_image).strip()
    if cover_str.startswith("http://") or cover_str.startswith("https://"):
        return cover_str
    if cover_str.startswith("/"):
        return cover_str
    return f"/uploads/albums/{cover_str}"

def search_youtube_video_id(query):
    """
    Finds YouTube Video ID for a song query:
    1. Pre-mapped catalog for popular hits (0ms response).
    2. In-memory cache for repeated lookups.
    3. Official YouTube Innertube API (WEB / ANDROID client, 0 rate limit, no API key needed).
    4. YouTube Data API v3 if key configured in settings.
    """
    if not query:
        return None

    norm_q = _normalize_title(query)
    cache_key = norm_q

    # Check cache
    if cache_key in _yt_video_cache:
        return _yt_video_cache[cache_key]

    # Check known popular catalog
    for key, vid in KNOWN_TRACK_VIDEOS.items():
        if key in norm_q or norm_q in key:
            _yt_video_cache[cache_key] = vid
            return vid

    # 1. Innertube API (Official YouTube client API)
    for client_name in ["WEB", "ANDROID"]:
        try:
            url = "https://www.youtube.com/youtubei/v1/search"
            payload = {
                "context": {
                    "client": {
                        "clientName": client_name,
                        "clientVersion": "2.20240101.00.00" if client_name == "WEB" else "19.09.37",
                        "hl": "vi",
                        "gl": "VN"
                    }
                },
                "query": f"{query} audio"
            }
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                sections = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
                for sec in sections:
                    items = sec.get("itemSectionRenderer", {}).get("contents", [])
                    for item in items:
                        v = item.get("videoRenderer")
                        if v and "videoId" in v and len(v["videoId"]) == 11:
                            vid = v["videoId"]
                            _yt_video_cache[cache_key] = vid
                            return vid
        except Exception as e:
            print(f"Innertube error ({client_name}): {e}")

    # 2. Official YouTube Data API v3 (if key provided)
    api_key = getattr(settings, "YOUTUBE_API_KEY", "") or os.getenv("YOUTUBE_API_KEY", "")
    if api_key:
        try:
            yt_url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                "part": "snippet",
                "q": f"{query} official audio",
                "type": "video",
                "maxResults": 1,
                "key": api_key
            }
            res = requests.get(yt_url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                items = data.get("items", [])
                if items:
                    vid = items[0]["id"]["videoId"]
                    _yt_video_cache[cache_key] = vid
                    return vid
        except Exception as e:
            print(f"YouTube Data API error: {e}")

    return None


@api_view(['GET'])
def spotify_search(request):
    """
    Searches tracks on Spotify Web API.
    Returns normalized track metadata with high-res cover art.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'tracks': []})

    token = get_spotify_access_token()
    if not token:
        # Fallback if no Spotify keys are provided:
        # Search local songs and return formatted
        from .models import Song
        from django.db.models import Q
        songs = Song.objects.filter(
            Q(name__icontains=query) | Q(artist__name__icontains=query)
        )[:15]
        tracks = []
        for s in songs:
            tracks.append({
                "id": f"local_{s.id}",
                "name": s.name,
                "artist": s.artist.name if s.artist else "Unknown Artist",
                "album": s.album.name if s.album else None,
                "duration": s.duration,
                "image_url": _format_cover_image(s.album.cover_image if s.album else None),
                "song_url": s.song_url,
                "premium": s.premium,
                "source": "local",
                "spotify_id": None
            })
        return Response({
            "tracks": tracks,
            "message": "Spotify API credentials not configured. Displaying local matches."
        })

    try:
        search_url = "https://api.spotify.com/v1/search"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"q": query, "type": "track", "limit": 20}
        res = requests.get(search_url, headers=headers, params=params, timeout=8)

        if res.status_code == 200:
            data = res.json()
            items = data.get("tracks", {}).get("items", [])
            tracks = []
            for item in items:
                images = item.get("album", {}).get("images", [])
                image_url = images[0]["url"] if images else "/default-cover.png"
                artists = ", ".join([a["name"] for a in item.get("artists", [])])
                duration_sec = int(item.get("duration_ms", 0) / 1000)

                tracks.append({
                    "id": f"sp_{item['id']}",
                    "name": item.get("name", "Unknown Title"),
                    "artist": artists,
                    "album": item.get("album", {}).get("name"),
                    "duration": duration_sec or 210,
                    "image_url": image_url,
                    "song_url": "", # Will stream via YouTube IFrame API
                    "premium": 0,
                    "source": "spotify",
                    "spotify_id": item.get("id"),
                    "external_url": item.get("external_urls", {}).get("spotify")
                })
            return Response({"tracks": tracks})
        else:
            return Response({"error": "Spotify API error", "details": res.text}, status=res.status_code)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def spotify_new_releases(request):
    """
    Gets new releases / top recommendations from Spotify Web API.
    """
    token = get_spotify_access_token()
    if not token:
        # Return local top songs as fallback
        from .models import Song
        songs = Song.objects.all().order_by("-play_count")[:10]
        tracks = []
        for s in songs:
            tracks.append({
                "id": f"local_{s.id}",
                "name": s.name,
                "artist": s.artist.name if s.artist else "Unknown Artist",
                "album": s.album.name if s.album else None,
                "duration": s.duration,
                "image_url": _format_cover_image(s.album.cover_image if s.album else None),
                "song_url": s.song_url,
                "premium": s.premium,
                "source": "local",
                "spotify_id": None
            })
        return Response({"tracks": tracks, "is_mock": True})

    try:
        url = "https://api.spotify.com/v1/browse/new-releases?limit=12"
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(url, headers=headers, timeout=8)

        if res.status_code == 200:
            data = res.json()
            albums = data.get("albums", {}).get("items", [])
            tracks = []
            for alb in albums:
                images = alb.get("images", [])
                image_url = images[0]["url"] if images else "/default-cover.png"
                artists = ", ".join([a["name"] for a in alb.get("artists", [])])
                tracks.append({
                    "id": f"sp_album_{alb['id']}",
                    "name": alb.get("name", "New Release"),
                    "artist": artists,
                    "album": alb.get("name"),
                    "duration": 220,
                    "image_url": image_url,
                    "song_url": "",
                    "premium": 0,
                    "source": "spotify",
                    "spotify_id": alb.get("id"),
                    "external_url": alb.get("external_urls", {}).get("spotify")
                })
            return Response({"tracks": tracks, "is_mock": False})
        else:
            return Response({"tracks": []})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def youtube_search_video(request):
    """
    Finds matching YouTube video ID for a song name and artist.
    """
    name = request.GET.get('name', '').strip()
    artist = request.GET.get('artist', '').strip()
    query = f"{name} {artist}".strip()

    if not query:
        return Response({'error': 'Vui lòng cung cấp tên bài hát hoặc nghệ sĩ'}, status=status.HTTP_400_BAD_REQUEST)

    video_id = search_youtube_video_id(query)
    if video_id:
        return Response({
            "video_id": video_id,
            "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}?autoplay=1&enablejsapi=1",
            "watch_url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        })
    else:
        return Response({'error': 'Không tìm thấy video phù hợp trên YouTube'}, status=status.HTTP_404_NOT_FOUND)
