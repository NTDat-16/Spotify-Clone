import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.models import Artist, Album, Song

def get_artist(name):
    obj = Artist.objects.filter(name=name).first()
    if not obj:
        obj = Artist.objects.create(name=name, status=1)
    return obj

def seed():
    print("=== SEEDING TAM THAI TU & LATEST HITS ===")

    # 1. Artists
    st = get_artist("Sơn Tùng M-TP")
    hieu = get_artist("HIEUTHUHAI")
    mono = get_artist("MONO")
    wren = get_artist("Wren Evans")
    pmq = get_artist("Phan Mạnh Quỳnh")
    rose = get_artist("ROSÉ & Bruno Mars")
    gaga = get_artist("Lady Gaga & Bruno Mars")

    # Artist cho album đặc biệt tổng hợp
    tam_thai_tu_artist = get_artist("Tam Thái Tử V-Pop (Sơn Tùng, HIEUTHUHAI, MONO)")


    # 2. Albums
    # A. Album Đặc Biệt: Tam Thái Tử
    album_ttt, _ = Album.objects.get_or_create(
        name="Album Đặc Biệt: Tam Thái Tử V-Pop",
        defaults={
            "artist": tam_thai_tu_artist,
            "created_at": datetime.date(2025, 1, 1),
            "cover_image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
            "status": 1
        }
    )

    # B. Album Sơn Tùng M-TP
    album_st, _ = Album.objects.get_or_create(
        name="Chúng Ta Của Tương Lai",
        defaults={
            "artist": st,
            "created_at": datetime.date(2024, 3, 8),
            "cover_image": "sontung.png",
            "status": 1
        }
    )

    # C. Album HIEUTHUHAI
    album_hieu, _ = Album.objects.get_or_create(
        name="Ai Cũng Phải Bắt Đầu Từ Đâu Đó",
        defaults={
            "artist": hieu,
            "created_at": datetime.date(2024, 10, 1),
            "cover_image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
            "status": 1
        }
    )

    # D. Album MONO
    album_mono, _ = Album.objects.get_or_create(
        name="22 & Đẹp (Deluxe)",
        defaults={
            "artist": mono,
            "created_at": datetime.date(2024, 11, 15),
            "cover_image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
            "status": 1
        }
    )

    # E. Album Wren Evans - LoiChoi
    album_wren, _ = Album.objects.get_or_create(
        name="LoiChoi: The Dragon",
        defaults={
            "artist": wren,
            "created_at": datetime.date(2024, 2, 1),
            "cover_image": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
            "status": 1
        }
    )

    # E. Top Trending Hits Toàn Cầu
    album_trending, _ = Album.objects.get_or_create(
        name="Top Hits & Trending 2025",
        defaults={
            "artist": rose,
            "created_at": datetime.date(2025, 2, 1),
            "cover_image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
            "status": 1
        }
    )

    # 3. Songs list definition
    songs_data = [
        # --- Album Đặc Biệt: Tam Thái Tử ---
        {"name": "Đừng Làm Trái Tim Anh Đau", "artist": st, "album": album_ttt, "duration": 215, "premium": 0, "play_count": 98000},
        {"name": "Trình", "artist": hieu, "album": album_ttt, "duration": 195, "premium": 0, "play_count": 92000},
        {"name": "Waiting For You", "artist": mono, "album": album_ttt, "duration": 265, "premium": 0, "play_count": 115000},
        {"name": "Chúng Ta Của Tương Lai", "artist": st, "album": album_ttt, "duration": 252, "premium": 1, "play_count": 89000},
        {"name": "Ngủ Một Mình", "artist": hieu, "album": album_ttt, "duration": 220, "premium": 0, "play_count": 87000},
        {"name": "Em Xinh", "artist": mono, "album": album_ttt, "duration": 200, "premium": 0, "play_count": 84000},
        {"name": "Không Thể Say", "artist": hieu, "album": album_ttt, "duration": 235, "premium": 1, "play_count": 78000},
        {"name": "Nơi Này Có Anh", "artist": st, "album": album_ttt, "duration": 260, "premium": 0, "play_count": 130000},
        {"name": "Đi Tìm Tình Yêu", "artist": mono, "album": album_ttt, "duration": 225, "premium": 0, "play_count": 71000},

        # --- Album Chúng Ta Của Tương Lai (Sơn Tùng M-TP) ---
        {"name": "Đừng Làm Trái Tim Anh Đau", "artist": st, "album": album_st, "duration": 215, "premium": 0, "play_count": 98000},
        {"name": "Chúng Ta Của Tương Lai", "artist": st, "album": album_st, "duration": 252, "premium": 1, "play_count": 89000},
        {"name": "Muộn Rồi Mà Sao Còn", "artist": st, "album": album_st, "duration": 275, "premium": 0, "play_count": 75000},
        {"name": "Lạc Trôi", "artist": st, "album": album_st, "duration": 232, "premium": 0, "play_count": 120000},
        {"name": "Hãy Trao Cho Anh", "artist": st, "album": album_st, "duration": 245, "premium": 1, "play_count": 105000},
        {"name": "Cơn Mưa Ngang Qua", "artist": st, "album": album_st, "duration": 230, "premium": 0, "play_count": 88000},

        # --- Album Ai Cũng Phải Bắt Đầu Từ Đâu Đó (HIEUTHUHAI) ---
        {"name": "Trình", "artist": hieu, "album": album_hieu, "duration": 195, "premium": 0, "play_count": 92000},
        {"name": "Không Thể Say", "artist": hieu, "album": album_hieu, "duration": 235, "premium": 1, "play_count": 78000},
        {"name": "Ngủ Một Mình", "artist": hieu, "album": album_hieu, "duration": 220, "premium": 0, "play_count": 87000},
        {"name": "Giờ Thì Ai Cười", "artist": hieu, "album": album_hieu, "duration": 210, "premium": 0, "play_count": 65000},
        {"name": "NOLOVEFHY", "artist": hieu, "album": album_hieu, "duration": 195, "premium": 0, "play_count": 63000},
        {"name": "Exit Sign", "artist": hieu, "album": album_hieu, "duration": 215, "premium": 1, "play_count": 81000},
        {"name": "Vệ Tinh", "artist": hieu, "album": album_hieu, "duration": 205, "premium": 0, "play_count": 59000},

        # --- Album 22 & Đẹp (MONO) ---
        {"name": "Waiting For You", "artist": mono, "album": album_mono, "duration": 265, "premium": 0, "play_count": 115000},
        {"name": "Em Xinh", "artist": mono, "album": album_mono, "duration": 200, "premium": 0, "play_count": 84000},
        {"name": "Đi Tìm Tình Yêu", "artist": mono, "album": album_mono, "duration": 225, "premium": 0, "play_count": 71000},
        {"name": "Chăm Hoa", "artist": mono, "album": album_mono, "duration": 190, "premium": 0, "play_count": 62000},
        {"name": "Quên Anh Đi", "artist": mono, "album": album_mono, "duration": 210, "premium": 0, "play_count": 58000},

        # --- Album LoiChoi: The Dragon (Wren Evans) ---
        {"name": "Từng Quen", "artist": wren, "album": album_wren, "duration": 175, "premium": 0, "play_count": 96000},
        {"name": "Tò Te Tí", "artist": wren, "album": album_wren, "duration": 185, "premium": 0, "play_count": 82000},
        {"name": "Bé Ơi Từ Từ", "artist": wren, "album": album_wren, "duration": 190, "premium": 0, "play_count": 67000},

        # --- Trending Hits 2025 ---
        {"name": "Sau Lời Từ Khước", "artist": pmq, "album": album_trending, "duration": 240, "premium": 0, "play_count": 108000},
        {"name": "APT.", "artist": rose, "album": album_trending, "duration": 170, "premium": 0, "play_count": 150000},
        {"name": "Die With A Smile", "artist": gaga, "album": album_trending, "duration": 251, "premium": 0, "play_count": 145000},
    ]

    count = 0
    for s_info in songs_data:
        song_obj, created = Song.objects.get_or_create(
            name=s_info["name"],
            artist=s_info["artist"],
            album=s_info["album"],
            defaults={
                "duration": s_info["duration"],
                "song_url": "", # Will stream via YouTube IFrame API!
                "premium": s_info["premium"],
                "play_count": s_info["play_count"],
                "status": 1
            }
        )
        if created:
            count += 1
            print(f"Created: {song_obj.name} - {song_obj.artist.name} ({song_obj.album.name})")

    print(f"Done! Created {count} new songs.")

if __name__ == "__main__":
    seed()
