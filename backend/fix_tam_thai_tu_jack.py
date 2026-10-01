import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.models import Artist, Album, Song

def fix_tam_thai_tu():
    print("=== REMOVING FAKE COMPILATION & SETTING UP JACK - J97'S REAL 'TAM THÁI TỬ' ALBUM ===")

    # 1. Xóa album tổng hợp cũ và nghệ sĩ giả lập
    old_albums = Album.objects.filter(name__icontains="Album Đặc Biệt: Tam Thái Tử V-Pop")
    print(f"Deleting {old_albums.count()} fake compilation albums...")
    old_albums.delete()

    fake_artists = Artist.objects.filter(name__icontains="Tam Thái Tử V-Pop")
    print(f"Deleting {fake_artists.count()} fake compilation artists...")
    fake_artists.delete()

    # 2. Nghệ sĩ Jack - J97
    jack = Artist.objects.filter(name__icontains="Jack").first()
    if not jack:
        jack = Artist.objects.create(name="Jack - J97", status=1)
    else:
        jack.name = "Jack - J97"
        jack.status = 1
        jack.save()
    print(f"Artist Jack: id={jack.id}, name={jack.name}")

    # 3. Tạo Album chính thức: "Tam Thái Tử" của Jack - J97
    album_ttt, created = Album.objects.get_or_create(
        name="Tam Thái Tử",
        artist=jack,
        defaults={
            "created_at": datetime.date(2026, 8, 29),
            "cover_image": "tamthaitu_jack.jpg",
            "status": 1
        }
    )
    if not created:
        album_ttt.cover_image = "tamthaitu_jack.jpg"
        album_ttt.created_at = datetime.date(2026, 8, 29)
        album_ttt.save()
    print(f"Album 'Tam Thái Tử' (Jack - J97): id={album_ttt.id}, created={created}")

    # 4. Danh sách 11 bài hát chính thức trong album "Tam Thái Tử" của Jack - J97
    jack_album_songs = [
        {"name": "Tam Thái Tử", "duration": 242, "premium": 0, "play_count": 185000},
        {"name": "Hoa Trong Đá", "duration": 215, "premium": 0, "play_count": 142000},
        {"name": "Người Dưng", "duration": 230, "premium": 0, "play_count": 138000},
        {"name": "Hào Hoa", "duration": 205, "premium": 0, "play_count": 125000},
        {"name": "Anh Yêu Em (我爱你)", "duration": 205, "premium": 0, "play_count": 118000},
        {"name": "Lưu Niên", "duration": 240, "premium": 0, "play_count": 112000},
        {"name": "Nếu Phải Giữ Cho Em", "duration": 210, "premium": 1, "play_count": 98000},
        {"name": "Mỗi Lần Nhớ Em Là Một Ngày Mưa", "duration": 250, "premium": 0, "play_count": 105000},
        {"name": "Nát Tan Cõi Lòng", "duration": 220, "premium": 0, "play_count": 94000},
        {"name": "Thì Ra Mình Đã Yêu Nhau Xong Rồi", "duration": 225, "premium": 1, "play_count": 110000},
        {"name": "Hướng Dương Bất Tức", "duration": 218, "premium": 0, "play_count": 91000},
        # Các bản hit tiêu biểu khác của Jack
        {"name": "Thiên Lý Ơi", "duration": 216, "premium": 0, "play_count": 175000},
        {"name": "Đom Đóm", "duration": 240, "premium": 0, "play_count": 160000},
        {"name": "Hoa Hải Đường", "duration": 215, "premium": 0, "play_count": 155000},
        {"name": "Sóng Gió", "duration": 250, "premium": 0, "play_count": 190000},
    ]

    added = 0
    for s in jack_album_songs:
        song_obj, created = Song.objects.get_or_create(
            name=s["name"],
            artist=jack,
            album=album_ttt,
            defaults={
                "duration": s["duration"],
                "song_url": "", # Tự động stream qua YouTube IFrame API!
                "premium": s["premium"],
                "play_count": s["play_count"],
                "status": 1
            }
        )
        if created:
            added += 1
            print(f"  + Added: {song_obj.name} - {jack.name} (Album: {album_ttt.name})")

    print(f"Done! Added {added} songs to album 'Tam Thái Tử' (Jack - J97).")

if __name__ == "__main__":
    fix_tam_thai_tu()
