import sys
from django.core.management.base import BaseCommand
from app.models import Song
from app.external_api import _save_tracks_to_db
import requests
import urllib.parse

class Command(BaseCommand):
    help = 'Batch import songs and albums from Apple Music / iTunes API into the database'

    def add_arguments(self, parser):
        parser.add_argument('--pack', type=str, default='vpop_top',
                            help="Preset pack: 'vpop_top', 'usuk_top', 'kpop_top', 'rap_viet', 'ballad_viet', 'sontung_jack', 'mega'")
        parser.add_argument('--query', type=str, default='',
                            help="Search query for artist or keyword (e.g. 'Taylor Swift')")
        parser.add_argument('--limit', type=int, default=50,
                            help="Limit number of tracks (default: 50, max: 100)")
        parser.add_argument('--country', type=str, default='VN',
                            help="Country code (VN, US, KR, etc.)")

    def handle(self, *args, **options):
        pack = options['pack']
        query = options['query']
        limit = max(10, min(options['limit'], 100))
        country = options['country']

        self.stdout.write(self.style.NOTICE(f"=== BAT DAU NAP KHO NHAC (Pack: {pack}, Query: {query}) ==="))

        total_imported = 0
        total_skipped = 0

        try:
            if query:
                q_enc = urllib.parse.quote(query)
                url = f"https://itunes.apple.com/search?term={q_enc}&entity=song&limit={limit}&country={country}"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    results = res.json().get('results', [])
                    imp, skp, _ = _save_tracks_to_db(results, is_rss=False)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'mega':
                tasks = [
                    ("https://itunes.apple.com/vn/rss/topsongs/limit=50/json", True),
                    ("https://itunes.apple.com/us/rss/topsongs/limit=40/json", True),
                    ("https://itunes.apple.com/kr/rss/topsongs/limit=30/json", True),
                    ("https://itunes.apple.com/search?term=rap+viet&entity=song&limit=30&country=VN", False),
                    ("https://itunes.apple.com/search?term=ballad+viet+nam&entity=song&limit=30&country=VN", False),
                ]
                for url, is_rss in tasks:
                    self.stdout.write(f"Fetching from: {url[:60]}...")
                    try:
                        res = requests.get(url, timeout=12)
                        if res.status_code == 200:
                            data = res.json()
                            items = data.get('feed', {}).get('entry', []) if is_rss else data.get('results', [])
                            imp, skp, _ = _save_tracks_to_db(items, is_rss=is_rss)
                            total_imported += imp
                            total_skipped += skp
                    except Exception as ex:
                        self.stdout.write(self.style.ERROR(f"Error fetching {url}: {ex}"))

            elif pack == 'vpop_top':
                url = f"https://itunes.apple.com/vn/rss/topsongs/limit={limit}/json"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    entries = res.json().get('feed', {}).get('entry', [])
                    imp, skp, _ = _save_tracks_to_db(entries, is_rss=True)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'usuk_top':
                url = f"https://itunes.apple.com/us/rss/topsongs/limit={limit}/json"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    entries = res.json().get('feed', {}).get('entry', [])
                    imp, skp, _ = _save_tracks_to_db(entries, is_rss=True)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'kpop_top':
                url = f"https://itunes.apple.com/kr/rss/topsongs/limit={limit}/json"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    entries = res.json().get('feed', {}).get('entry', [])
                    imp, skp, _ = _save_tracks_to_db(entries, is_rss=True)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'rap_viet':
                url = f"https://itunes.apple.com/search?term=rap+viet&entity=song&limit={limit}&country=VN"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    results = res.json().get('results', [])
                    imp, skp, _ = _save_tracks_to_db(results, is_rss=False)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'ballad_viet':
                url = f"https://itunes.apple.com/search?term=ballad+viet+nam&entity=song&limit={limit}&country=VN"
                res = requests.get(url, timeout=12)
                if res.status_code == 200:
                    results = res.json().get('results', [])
                    imp, skp, _ = _save_tracks_to_db(results, is_rss=False)
                    total_imported += imp
                    total_skipped += skp

            elif pack == 'sontung_jack':
                for kw in ["son tung m-tp", "jack j97"]:
                    url = f"https://itunes.apple.com/search?term={urllib.parse.quote(kw)}&entity=song&limit={int(limit/2)}&country=VN"
                    res = requests.get(url, timeout=12)
                    if res.status_code == 200:
                        results = res.json().get('results', [])
                        imp, skp, _ = _save_tracks_to_db(results, is_rss=False)
                        total_imported += imp
                        total_skipped += skp

            total_now = Song.objects.count()
            self.stdout.write(self.style.SUCCESS(
                f"[THANH CONG] Da them moi {total_imported} bai hat! (Bo qua {total_skipped} bai da ton tai).\n"
                f"Tong so bai hat hien co trong thu vien: {total_now} bai."
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[LOI] Khong the nap kho nhac: {e}"))
