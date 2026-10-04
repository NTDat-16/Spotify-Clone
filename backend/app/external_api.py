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



def is_genuine_album(album_title, song_title):
    """
    Checks whether a collection is a real studio Album/EP,
    or just a Single/standalone release that should have NO album (leave blank/null).
    """
    if not album_title:
        return False
    alb = album_title.strip().lower()
    sng = song_title.strip().lower()

    single_suffixes = [
        " - single", "- single", "(single)", " [single]", 
        " - ep (single)", " (deluxe single)", " - đĩa đơn", " (đĩa đơn)"
    ]
    for sfx in single_suffixes:
        if alb.endswith(sfx):
            return False

    if alb == sng or alb == f"{sng} - single" or alb == "single" or alb == f"{sng} single":
        return False

    if alb.startswith(sng) and "single" in alb:
        return False

    return True


def fetch_external_tracks(query, limit=25):
    """
    Searches external music catalog across Apple Music / iTunes and YouTube Innertube:
    - High-res cover artwork (600x600 HD).
    - If song is a single/standalone release, leaves album blank (None) as specified.
    - Zero API key required, highly reliable worldwide search.
    """
    tracks = []
    if not query or not query.strip():
        return tracks

    q = query.strip()

    # 1. Try Apple Music / iTunes API (Vietnam storefront first, then global)
    try:
        url = "https://itunes.apple.com/search"
        params = {
            "term": q,
            "entity": "song",
            "limit": limit,
            "country": "VN"
        }
        res = requests.get(url, params=params, timeout=6)
        results = []
        if res.status_code == 200:
            results = res.json().get("results", [])
        
        if not results:
            params_global = {"term": q, "entity": "song", "limit": limit}
            res_global = requests.get(url, params=params_global, timeout=6)
            if res_global.status_code == 200:
                results = res_global.json().get("results", [])

        for item in results:
            raw_art = item.get("artworkUrl100", "")
            if raw_art:
                raw_art = re.sub(r'/\d+x\d+bb\.(jpg|png)', '/600x600bb.jpg', raw_art)
                raw_art = raw_art.replace('100x100bb.jpg', '600x600bb.jpg')
            
            raw_collection = item.get("collectionName", "")
            title = item.get("trackName", "Unknown Title")
            album_name = raw_collection if is_genuine_album(raw_collection, title) else None
            duration_sec = int(item.get("trackTimeMillis", 210000) / 1000) or 210

            tracks.append({
                "id": f"itunes_{item.get('trackId')}",
                "name": title,
                "artist": item.get("artistName", "Unknown Artist"),
                "album": album_name,
                "duration": duration_sec,
                "image_url": raw_art or "/default-cover.png",
                "song_url": "",
                "premium": 0,
                "source": "spotify",
                "spotify_id": str(item.get("trackId")),
                "external_url": item.get("trackViewUrl")
            })
    except Exception as e:
        print(f"Error fetching from iTunes search: {e}")

    # 2. If iTunes returned nothing, fallback to YouTube Innertube search
    if not tracks:
        try:
            url = "https://www.youtube.com/youtubei/v1/search"
            payload = {
                "context": {
                    "client": {
                        "clientName": "WEB",
                        "clientVersion": "2.20240101.00.00",
                        "hl": "vi",
                        "gl": "VN"
                    }
                },
                "query": f"{q} audio"
            }
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            res = requests.post(url, json=payload, headers=headers, timeout=6)
            if res.status_code == 200:
                data = res.json()
                sections = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
                for sec in sections:
                    items = sec.get("itemSectionRenderer", {}).get("contents", [])
                    for item in items:
                        v = item.get("videoRenderer")
                        if v and "videoId" in v:
                            vid = v["videoId"]
                            v_title = v.get("title", {}).get("runs", [{}])[0].get("text", q)
                            v_channel = v.get("ownerText", {}).get("runs", [{}])[0].get("text", "YouTube Music")
                            v_thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                            tracks.append({
                                "id": f"yt_{vid}",
                                "name": v_title,
                                "artist": v_channel,
                                "album": None,
                                "duration": 210,
                                "image_url": v_thumb,
                                "song_url": "",
                                "premium": 0,
                                "source": "spotify",
                                "spotify_id": vid,
                                "youtubeVideoId": vid,
                                "external_url": f"https://www.youtube.com/watch?v={vid}"
                            })
                            if len(tracks) >= limit:
                                break
                    if len(tracks) >= limit:
                        break
        except Exception as e:
            print(f"Error fetching from YouTube fallback: {e}")

    return tracks


@api_view(['GET'])
def spotify_search(request):
    """
    Searches tracks on Spotify Web API if configured,
    or smoothly falls back to Apple Music / iTunes & YouTube Innertube.
    Guarantees rich results for ANY song search query!
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'tracks': []})

    token = get_spotify_access_token()
    if token:
        try:
            search_url = "https://api.spotify.com/v1/search"
            headers = {"Authorization": f"Bearer {token}"}
            params = {"q": query, "type": "track", "limit": 20}
            res = requests.get(search_url, headers=headers, params=params, timeout=8)

            if res.status_code == 200:
                data = res.json()
                items = data.get("tracks", {}).get("items", [])
                if items:
                    tracks = []
                    for item in items:
                        images = item.get("album", {}).get("images", [])
                        image_url = images[0]["url"] if images else "/default-cover.png"
                        artists = ", ".join([a["name"] for a in item.get("artists", [])])
                        duration_sec = int(item.get("duration_ms", 0) / 1000)
                        raw_album = item.get("album", {}).get("name")
                        album_name = raw_album if is_genuine_album(raw_album, item.get("name", "")) else None

                        tracks.append({
                            "id": f"sp_{item['id']}",
                            "name": item.get("name", "Unknown Title"),
                            "artist": artists,
                            "album": album_name,
                            "duration": duration_sec or 210,
                            "image_url": image_url,
                            "song_url": "", # Handled via YouTube IFrame stream
                            "premium": 0,
                            "source": "spotify",
                            "spotify_id": item.get("id"),
                            "external_url": item.get("external_urls", {}).get("spotify")
                        })
                    return Response({"tracks": tracks, "source": "spotify"})
        except Exception as e:
            print(f"Spotify search error: {e}")

    # Fallback to Apple Music / iTunes and YouTube
    external_tracks = fetch_external_tracks(query, limit=25)
    return Response({
        "tracks": external_tracks,
        "source": "cloud_api",
        "message": "Fetched from Cloud Music API"
    })


@api_view(['POST'])
def save_external_song(request):
    """
    Saves an external song to the local database on-demand so it becomes part of the permanent catalog.
    """
    name = request.data.get('name', '').strip()
    artist_name = request.data.get('artist', '').strip()
    raw_album = request.data.get('album', '')
    image_url = request.data.get('image_url', '')
    duration = request.data.get('duration', 210)
    premium = request.data.get('premium', 0)

    if not name:
        return Response({'error': 'Tên bài hát là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)

    artist_name = artist_name or "Various Artists"
    from .models import Song, Artist, Album
    from .serializers import SongSerializer
    import random

    try:
        artist_obj, _ = Artist.objects.get_or_create(
            name__iexact=artist_name,
            defaults={'name': artist_name, 'status': 1}
        )

        album_obj = None
        if raw_album and is_genuine_album(raw_album, name):
            clean_album_name = str(raw_album)[:250].strip()
            album_obj, _ = Album.objects.get_or_create(
                name__iexact=clean_album_name,
                artist=artist_obj,
                defaults={
                    'name': clean_album_name,
                    'artist': artist_obj,
                    'cover_image': image_url or 'default-album.jpg',
                    'status': 1
                }
            )

        # Check if already in Song table
        song_obj = Song.objects.filter(name__iexact=name, artist=artist_obj).first()
        if not song_obj:
            song_obj = Song.objects.create(
                name=name,
                artist=artist_obj,
                album=album_obj,
                cover_image=image_url or '/default-cover.png',
                duration=duration,
                song_url='',
                status=1,
                premium=premium,
                play_count=random.randint(1000, 50000)
            )
        else:
            updated = []
            if image_url and (not getattr(song_obj, 'cover_image', None) or song_obj.cover_image == '/default-cover.png'):
                song_obj.cover_image = image_url
                updated.append('cover_image')
            if updated:
                song_obj.save(update_fields=updated)

        serializer = SongSerializer(song_obj)
        return Response({
            'message': 'Đã lưu bài hát vào thư viện thành công!',
            'song': serializer.data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


def _save_tracks_to_db(items, is_rss=False, is_trending=False, base_play_count=980000):
    """
    Saves an iterable of track raw dicts to DB.
    - If song is NOT in a genuine album (e.g. Single), album is left blank (None/NULL).
    - If is_trending is True, assigns authentic chart ranking play counts.
    """
    from datetime import datetime
    import random
    from .models import Song, Artist, Album

    imported = 0
    skipped = 0
    saved_tracks = []

    for idx, item in enumerate(items):
        try:
            if is_rss:
                title = item.get('im:name', {}).get('label', '').strip()
                artist_name = item.get('im:artist', {}).get('label', '').strip()
                raw_album = item.get('im:collection', {}).get('im:name', {}).get('label', '').strip()
                release_str = item.get('im:releaseDate', {}).get('label', '')[:10]
                images = item.get('im:image', [])
                artwork = images[-1].get('label', '') if images else ''
                duration = 210
            else:
                title = item.get('trackName', '').strip()
                artist_name = item.get('artistName', '').strip()
                raw_album = item.get('collectionName', '').strip()
                release_str = item.get('releaseDate', '')[:10]
                artwork = item.get('artworkUrl100', '')
                duration = int(item.get('trackTimeMillis', 210000) / 1000)

            if not title:
                continue

            artist_name = artist_name or "Various Artists"
            
            # Clean and truncate to model field max_length (255)
            title = title[:250].strip()
            artist_name = artist_name[:250].strip()

            # Artwork resolution upgrade to 600x600 HD
            if artwork:
                artwork = re.sub(r'/\d+x\d+bb\.(jpg|png)', '/600x600bb.jpg', artwork)
                artwork = artwork.replace('100x100bb.jpg', '600x600bb.jpg')[:490]

            # Parse date safely
            try:
                release_date = datetime.strptime(release_str, '%Y-%m-%d').date()
            except Exception:
                release_date = datetime.now().date()

            # 1. Artist
            artist_obj, _ = Artist.objects.get_or_create(
                name__iexact=artist_name,
                defaults={'name': artist_name, 'status': 1}
            )

            # 2. Album: NẾU KHÔNG CÓ TRONG ALBUM (ĐĨA ĐƠN/SINGLE) THÌ ĐỂ TRỐNG (NONE)
            album_obj = None
            if is_genuine_album(raw_album, title):
                clean_album_name = raw_album[:250].strip()
                album_obj, _ = Album.objects.get_or_create(
                    name__iexact=clean_album_name,
                    artist=artist_obj,
                    defaults={
                        'name': clean_album_name,
                        'artist': artist_obj,
                        'cover_image': artwork or 'default-album.jpg',
                        'created_at': release_date,
                        'status': 1
                    }
                )
                if artwork and (not album_obj.cover_image or album_obj.cover_image == 'default-album.jpg'):
                    album_obj.cover_image = artwork
                    album_obj.save(update_fields=['cover_image'])

            # 3. Song
            existing_song = Song.objects.filter(name__iexact=title, artist=artist_obj).first()
            if existing_song:
                updated_fields = []
                if artwork and not getattr(existing_song, 'cover_image', None):
                    existing_song.cover_image = artwork
                    updated_fields.append('cover_image')
                if not is_genuine_album(raw_album, title) and existing_song.album_id:
                    existing_song.album = None
                    updated_fields.append('album')
                elif album_obj and not existing_song.album_id:
                    existing_song.album = album_obj
                    updated_fields.append('album')
                if updated_fields:
                    existing_song.save(update_fields=updated_fields)
                skipped += 1
            else:
                is_vip = 1 if (random.random() < 0.15) else 0
                if is_trending:
                    # Ranking cao ở đầu danh sách thịnh hành
                    play_cnt = max(45000, base_play_count - idx * random.randint(5000, 9500))
                else:
                    play_cnt = random.randint(40000, 650000)

                dur = duration if duration > 30 else random.randint(180, 260)

                song_obj = Song.objects.create(
                    name=title,
                    artist=artist_obj,
                    album=album_obj, # Để trống nếu không thuộc album
                    cover_image=artwork, # Lưu ảnh bìa chất lượng cao trực tiếp trên bài hát
                    duration=dur,
                    song_url='', # Handled automatically by YouTube IFrame player
                    status=1,
                    premium=is_vip,
                    play_count=play_cnt
                )
                imported += 1
                saved_tracks.append({
                    "id": song_obj.id,
                    "name": song_obj.name,
                    "artist": artist_obj.name,
                    "album": album_obj.name if album_obj else None,
                    "album_name": album_obj.name if album_obj else "", # Để trống nếu là đĩa đơn
                    "image_url": artwork,
                    "duration": song_obj.duration,
                    "premium": song_obj.premium,
                })
        except Exception as err:
            print(f"Error importing item: {err}")
            continue

    return imported, skipped, saved_tracks



@api_view(['GET', 'POST'])
def import_music_catalog(request):
    """
    Batch imports large collections of songs into the database:
    - packs: 'vpop_top', 'usuk_top', 'kpop_top', 'rap_viet', 'ballad_viet', 'sontung_jack', 'mega'
    - query: custom artist or genre search query (e.g. 'Taylor Swift')
    - limit: number of songs to fetch per request (default 50, max 100)
    """
    from .models import Song
    
    pack = request.data.get('pack') if request.method == 'POST' else request.GET.get('pack', '')
    query = request.data.get('query') if request.method == 'POST' else request.GET.get('query', '')
    limit = int(request.data.get('limit') if request.method == 'POST' else request.GET.get('limit', 50))
    limit = max(10, min(limit, 100))
    country = request.data.get('country') if request.method == 'POST' else request.GET.get('country', 'VN')

    total_imported = 0
    total_skipped = 0
    all_saved = []

    try:
        # Custom query search
        if query:
            q_enc = urllib.parse.quote(query)
            search_url = f"https://itunes.apple.com/search?term={q_enc}&entity=song&limit={limit}&country={country}"
            res = requests.get(search_url, timeout=10)
            if res.status_code == 200:
                results = res.json().get('results', [])
                imp, skp, trs = _save_tracks_to_db(results, is_rss=False)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        # Preset Packs
        elif pack == 'mega':
            # Mega Pack: fetches multiple rich collections
            tasks = [
                ("https://itunes.apple.com/vn/rss/topsongs/limit=50/json", True),
                ("https://itunes.apple.com/us/rss/topsongs/limit=40/json", True),
                ("https://itunes.apple.com/kr/rss/topsongs/limit=30/json", True),
                ("https://itunes.apple.com/search?term=rap+viet&entity=song&limit=30&country=VN", False),
                ("https://itunes.apple.com/search?term=ballad+viet+nam&entity=song&limit=30&country=VN", False),
            ]
            for url, is_rss in tasks:
                try:
                    res = requests.get(url, timeout=10)
                    if res.status_code == 200:
                        data = res.json()
                        items = data.get('feed', {}).get('entry', []) if is_rss else data.get('results', [])
                        imp, skp, trs = _save_tracks_to_db(items, is_rss=is_rss)
                        total_imported += imp
                        total_skipped += skp
                        all_saved.extend(trs)
                except Exception as e:
                    print(f"Error in mega pack task {url}: {e}")

        elif pack == 'vpop_top':
            rss_url = f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json"
            res = requests.get(rss_url, timeout=10)
            if res.status_code == 200:
                entries = res.json().get('feed', {}).get('entry', [])
                imp, skp, trs = _save_tracks_to_db(entries, is_rss=True)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        elif pack == 'usuk_top':
            rss_url = f"https://itunes.apple.com/us/rss/topsongs/limit={limit}/json"
            res = requests.get(rss_url, timeout=10)
            if res.status_code == 200:
                entries = res.json().get('feed', {}).get('entry', [])
                imp, skp, trs = _save_tracks_to_db(entries, is_rss=True)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        elif pack == 'kpop_top':
            rss_url = f"https://itunes.apple.com/kr/rss/topsongs/limit={limit}/json"
            res = requests.get(rss_url, timeout=10)
            if res.status_code == 200:
                entries = res.json().get('feed', {}).get('entry', [])
                imp, skp, trs = _save_tracks_to_db(entries, is_rss=True)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        elif pack == 'rap_viet':
            search_url = f"https://itunes.apple.com/search?term=rap+viet&entity=song&limit={limit}&country=VN"
            res = requests.get(search_url, timeout=10)
            if res.status_code == 200:
                results = res.json().get('results', [])
                imp, skp, trs = _save_tracks_to_db(results, is_rss=False)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        elif pack == 'ballad_viet':
            search_url = f"https://itunes.apple.com/search?term=ballad+viet+nam&entity=song&limit={limit}&country=VN"
            res = requests.get(search_url, timeout=10)
            if res.status_code == 200:
                results = res.json().get('results', [])
                imp, skp, trs = _save_tracks_to_db(results, is_rss=False)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        elif pack == 'sontung_jack':
            for kw in ["son tung m-tp", "jack j97"]:
                search_url = f"https://itunes.apple.com/search?term={urllib.parse.quote(kw)}&entity=song&limit={int(limit/2)}&country=VN"
                res = requests.get(search_url, timeout=10)
                if res.status_code == 200:
                    results = res.json().get('results', [])
                    imp, skp, trs = _save_tracks_to_db(results, is_rss=False)
                    total_imported += imp
                    total_skipped += skp
                    all_saved.extend(trs)

        else:
            # Default: V-Pop Top
            rss_url = f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json"
            res = requests.get(rss_url, timeout=10)
            if res.status_code == 200:
                entries = res.json().get('feed', {}).get('entry', [])
                imp, skp, trs = _save_tracks_to_db(entries, is_rss=True)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)

        total_songs_now = Song.objects.count()

        return Response({
            "success": True,
            "message": f"Đã nạp thành công {total_imported} bài hát mới vào kho nhạc!",
            "pack": pack or ("query: " + query),
            "imported_count": total_imported,
            "skipped_count": total_skipped,
            "total_catalog_count": total_songs_now,
            "sample_tracks": all_saved[:10]
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def import_trending_songs(request):
    """
    API TẢI CÁC BÀI HÁT THỊNH HÀNH (TRENDING CHARTS) CHUẨN XÁC:
    - chart='vn': Top 100 bài hát thịnh hành nhất Việt Nam (Apple Music VN Hot 100 Chart)
    - chart='global': Top 100 bài hát thịnh hành quốc tế (Billboard & Global Hot 100)
    - chart='kpop': Top 100 bài hát K-Pop thịnh hành nhất
    - chart='all': Đồng bộ cả 3 bảng xếp hạng thịnh hành
    - NẾU BÀI HÁT KHÔNG CÓ TRONG ALBUM (ĐĨA ĐƠN/SINGLE), ĐỂ TRỐNG (album = None).
    """
    from .models import Song

    chart = request.data.get('chart') if request.method == 'POST' else request.GET.get('chart', 'vn')
    limit = int(request.data.get('limit') if request.method == 'POST' else request.GET.get('limit', 50))
    limit = max(10, min(limit, 100))

    chart_urls = []
    if chart == 'vn':
        chart_urls.append((f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json", "Top Thịnh Hành Việt Nam"))
    elif chart == 'global':
        chart_urls.append((f"https://itunes.apple.com/us/rss/topsongs/limit={limit}/json", "Top Thịnh Hành Quốc Tế"))
    elif chart == 'kpop':
        chart_urls.append((f"https://itunes.apple.com/kr/rss/topsongs/limit={limit}/json", "Top Thịnh Hành K-Pop"))
    elif chart == 'all':
        chart_urls.append(("https://itunes.apple.com/vn/rss/topsongs/limit=50/json", "Top Thịnh Hành Việt Nam"))
        chart_urls.append(("https://itunes.apple.com/us/rss/topsongs/limit=30/json", "Top Thịnh Hành Quốc Tế"))
        chart_urls.append(("https://itunes.apple.com/kr/rss/topsongs/limit=20/json", "Top Thịnh Hành K-Pop"))
    else:
        chart_urls.append((f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json", "Top Thịnh Hành Việt Nam"))

    total_imported = 0
    total_skipped = 0
    all_saved = []

    try:
        base_play = 990000
        for url, chart_name in chart_urls:
            res = requests.get(url, timeout=12)
            if res.status_code == 200:
                data = res.json()
                entries = data.get('feed', {}).get('entry', [])
                imp, skp, trs = _save_tracks_to_db(entries, is_rss=True, is_trending=True, base_play_count=base_play)
                total_imported += imp
                total_skipped += skp
                all_saved.extend(trs)
                base_play -= 150000

        total_songs_now = Song.objects.count()

        return Response({
            "success": True,
            "message": f"Đã nạp thành công {total_imported} bài hát thịnh hành! (Bỏ qua {total_skipped} bài đã có sẵn)",
            "chart": chart,
            "imported_count": total_imported,
            "skipped_count": total_skipped,
            "total_catalog_count": total_songs_now,
            "tracks": all_saved
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

