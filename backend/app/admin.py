from django.contrib import admin
from .models import User, Song, Playlist, PlaylistSong, Artist, Album  # ✅ Thêm Artist, Album

admin.site.register(User)
admin.site.register(Song)
admin.site.register(Playlist)
admin.site.register(PlaylistSong)
admin.site.register(Artist)
admin.site.register(Album)