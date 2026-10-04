from django.core.management.base import BaseCommand
from app.models import Song
from app.external_api import _save_tracks_to_db
import requests

class Command(BaseCommand):
    help = 'Tải các bài hát thịnh hành (Trending Charts) từ Apple Music Top Charts. Đĩa đơn (Single) sẽ để trống Album.'

    def add_arguments(self, parser):
        parser.add_argument('--chart', type=str, default='vn',
                            choices=['vn', 'global', 'kpop', 'all'],
                            help="Bảng xếp hạng thịnh hành: 'vn' (Top VN), 'global' (Top US-UK/Toàn Cầu), 'kpop' (Top Hàn Quốc), 'all'")
        parser.add_argument('--limit', type=int, default=50,
                            help="Số lượng bài hát cần nạp (10 - 100, mặc định: 50)")

    def handle(self, *args, **options):
        chart = options['chart']
        limit = max(10, min(options['limit'], 100))

        self.stdout.write(self.style.NOTICE(f"=== BAT DAU TAI BAI HAT THINH HANH (BXH: {chart.upper()}, Limit: {limit} bai) ==="))

        chart_tasks = []
        if chart == 'vn':
            chart_tasks.append((f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json", "Top 100 Thinh Hanh Viet Nam"))
        elif chart == 'global':
            chart_tasks.append((f"https://itunes.apple.com/us/rss/topsongs/limit={limit}/json", "Top 100 Thinh Hanh Toan Cau / Billboard"))
        elif chart == 'kpop':
            chart_tasks.append((f"https://itunes.apple.com/kr/rss/topsongs/limit={limit}/json", "Top 100 K-Pop Thinh Hanh"))
        elif chart == 'all':
            chart_tasks.append(("https://itunes.apple.com/vn/rss/topsongs/limit=50/json", "Top 50 Thinh Hanh Viet Nam"))
            chart_tasks.append(("https://itunes.apple.com/us/rss/topsongs/limit=30/json", "Top 30 Thinh Hanh Toan Cau"))
            chart_tasks.append(("https://itunes.apple.com/kr/rss/topsongs/limit=20/json", "Top 20 K-Pop Thinh Hanh"))

        total_imported = 0
        total_skipped = 0
        base_play = 990000

        try:
            for url, label in chart_tasks:
                self.stdout.write(f"Dong bo: {label}...")
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    entries = res.json().get('feed', {}).get('entry', [])
                    imp, skp, _ = _save_tracks_to_db(entries, is_rss=True, is_trending=True, base_play_count=base_play)
                    total_imported += imp
                    total_skipped += skp
                    base_play -= 150000
                    self.stdout.write(f"  + Them moi: {imp} bai | Da ton tai: {skp} bai.")
                else:
                    self.stdout.write(self.style.ERROR(f"  - Loi ket noi {url} (HTTP {res.status_code})"))

            total_now = Song.objects.count()
            singles_count = Song.objects.filter(album__isnull=True).count()
            self.stdout.write(self.style.SUCCESS(
                f"\n[THANH CONG] Da nap {total_imported} bai hat thinh hanh moi!\n"
                f"Tong so bai hat trong thu vien: {total_now} bai (Trong do co {singles_count} dia don de trong Album)."
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[LOI] Khong the tai BXH thinh hanh: {e}"))

