-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for spotify_clone
CREATE DATABASE IF NOT EXISTS `spotify_clone` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `spotify_clone`;

-- Dumping data for table spotify_clone.albums: ~2 rows (approximately)
INSERT INTO `albums` (`id`, `title`, `artist`, `image_url`, `release_year`, `description`) VALUES
	(1, 'Jack ft K-ICM', 'Jack', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/8/3/6/c/836cf31f036fb8f89b78cfd07cd77477.jpg', 2020, ''),
	(3, 'Workout Mix', 'Various', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', 2019, 'A collection of relaxing tunes to unwind and chill');

-- Dumping data for table spotify_clone.albums_songs: ~7 rows (approximately)
INSERT INTO `albums_songs` (`id`, `album_id`, `song_id`) VALUES
	(1, 1, 1),
	(5, 1, 3),
	(6, 3, 7),
	(7, 3, 8),
	(8, 3, 9),
	(9, 3, 10),
	(10, 3, 11);

-- Dumping data for table spotify_clone.auth_group: ~0 rows (approximately)

-- Dumping data for table spotify_clone.auth_group_permissions: ~0 rows (approximately)

-- Dumping data for table spotify_clone.auth_permission: ~32 rows (approximately)
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
	(1, 'Can add log entry', 1, 'add_logentry'),
	(2, 'Can change log entry', 1, 'change_logentry'),
	(3, 'Can delete log entry', 1, 'delete_logentry'),
	(4, 'Can view log entry', 1, 'view_logentry'),
	(5, 'Can add permission', 2, 'add_permission'),
	(6, 'Can change permission', 2, 'change_permission'),
	(7, 'Can delete permission', 2, 'delete_permission'),
	(8, 'Can view permission', 2, 'view_permission'),
	(9, 'Can add group', 3, 'add_group'),
	(10, 'Can change group', 3, 'change_group'),
	(11, 'Can delete group', 3, 'delete_group'),
	(12, 'Can view group', 3, 'view_group'),
	(13, 'Can add user', 4, 'add_user'),
	(14, 'Can change user', 4, 'change_user'),
	(15, 'Can delete user', 4, 'delete_user'),
	(16, 'Can view user', 4, 'view_user'),
	(17, 'Can add content type', 5, 'add_contenttype'),
	(18, 'Can change content type', 5, 'change_contenttype'),
	(19, 'Can delete content type', 5, 'delete_contenttype'),
	(20, 'Can view content type', 5, 'view_contenttype'),
	(21, 'Can add session', 6, 'add_session'),
	(22, 'Can change session', 6, 'change_session'),
	(23, 'Can delete session', 6, 'delete_session'),
	(24, 'Can view session', 6, 'view_session'),
	(25, 'Can add song', 7, 'add_song'),
	(26, 'Can change song', 7, 'change_song'),
	(27, 'Can delete song', 7, 'delete_song'),
	(28, 'Can view song', 7, 'view_song'),
	(29, 'Can add album', 8, 'add_album'),
	(30, 'Can change album', 8, 'change_album'),
	(31, 'Can delete album', 8, 'delete_album'),
	(32, 'Can view album', 8, 'view_album'),
	(33, 'Can add user', 9, 'add_user'),
	(34, 'Can change user', 9, 'change_user'),
	(35, 'Can delete user', 9, 'delete_user'),
	(36, 'Can view user', 9, 'view_user'),
	(37, 'Can add loved songs', 10, 'add_lovedsongs'),
	(38, 'Can change loved songs', 10, 'change_lovedsongs'),
	(39, 'Can delete loved songs', 10, 'delete_lovedsongs'),
	(40, 'Can view loved songs', 10, 'view_lovedsongs');

-- Dumping data for table spotify_clone.auth_user: ~0 rows (approximately)

-- Dumping data for table spotify_clone.auth_user_groups: ~0 rows (approximately)

-- Dumping data for table spotify_clone.auth_user_user_permissions: ~0 rows (approximately)

-- Dumping data for table spotify_clone.django_admin_log: ~0 rows (approximately)

-- Dumping data for table spotify_clone.django_content_type: ~8 rows (approximately)
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
	(1, 'admin', 'logentry'),
	(8, 'api', 'album'),
	(10, 'api', 'lovedsongs'),
	(7, 'api', 'song'),
	(9, 'api', 'user'),
	(3, 'auth', 'group'),
	(2, 'auth', 'permission'),
	(4, 'auth', 'user'),
	(5, 'contenttypes', 'contenttype'),
	(6, 'sessions', 'session');

-- Dumping data for table spotify_clone.django_migrations: ~19 rows (approximately)
INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
	(1, 'contenttypes', '0001_initial', '2025-03-18 15:19:49.747558'),
	(2, 'auth', '0001_initial', '2025-03-18 15:19:50.594837'),
	(3, 'admin', '0001_initial', '2025-03-18 15:19:50.833210'),
	(4, 'admin', '0002_logentry_remove_auto_add', '2025-03-18 15:19:50.848418'),
	(5, 'admin', '0003_logentry_add_action_flag_choices', '2025-03-18 15:19:50.863357'),
	(6, 'api', '0001_initial', '2025-03-18 15:19:51.127910'),
	(7, 'contenttypes', '0002_remove_content_type_name', '2025-03-18 15:22:02.574872'),
	(8, 'auth', '0002_alter_permission_name_max_length', '2025-03-18 15:22:02.656932'),
	(9, 'auth', '0003_alter_user_email_max_length', '2025-03-18 15:22:02.678495'),
	(10, 'auth', '0004_alter_user_username_opts', '2025-03-18 15:22:02.691927'),
	(11, 'auth', '0005_alter_user_last_login_null', '2025-03-18 15:22:02.776050'),
	(12, 'auth', '0006_require_contenttypes_0002', '2025-03-18 15:22:02.785438'),
	(13, 'auth', '0007_alter_validators_add_error_messages', '2025-03-18 15:22:02.801816'),
	(14, 'auth', '0008_alter_user_username_max_length', '2025-03-18 15:22:02.826667'),
	(15, 'auth', '0009_alter_user_last_name_max_length', '2025-03-18 15:22:02.852019'),
	(16, 'auth', '0010_alter_group_name_max_length', '2025-03-18 15:22:02.878244'),
	(17, 'auth', '0011_update_proxy_permissions', '2025-03-18 15:22:02.892922'),
	(18, 'auth', '0012_alter_user_first_name_max_length', '2025-03-18 15:22:02.916706'),
	(19, 'sessions', '0001_initial', '2025-03-18 15:22:02.965903'),
	(20, 'api', '0002_alter_album_image_url_alter_album_release_year_and_more', '2025-03-19 15:59:57.852069'),
	(21, 'api', '0003_alter_album_release_year', '2025-03-19 16:11:42.616356'),
	(22, 'api', '0004_album_description_alter_song_image_url', '2025-03-20 01:05:44.527283'),
	(23, 'api', '0005_user', '2025-03-21 08:59:19.154445'),
	(24, 'api', '0006_lovedsongs', '2025-03-21 16:06:09.838954');

-- Dumping data for table spotify_clone.django_session: ~0 rows (approximately)

-- Dumping data for table spotify_clone.loved_songs: ~0 rows (approximately)
INSERT INTO `loved_songs` (`id`, `songs_id`, `user_id`) VALUES
	(1, 1, 1);

-- Dumping data for table spotify_clone.songs: ~11 rows (approximately)
INSERT INTO `songs` (`id`, `title`, `artist`, `image_url`, `audio_url`, `duration`) VALUES
	(1, 'Sóng Gió', 'Jack, K-ICM', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/8/3/6/c/836cf31f036fb8f89b78cfd07cd77477.jpg', '', 0),
	(2, 'Hồng Nhan', 'Jack', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/3/2/7/f/327f68099674128289ba8a2e98232d68.jpg', '', 0),
	(3, 'Bạc Phận', 'Jack, K-ICM', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/4/2/5/3/425334e6f252b8c34d74d16177a5eb9d.jpg', '', 0),
	(4, 'Nước Ngoài', 'Phan Mạnh Quỳnh', 'https://photo-resize-zmp3.zmdcdn.me/w240_r1x1_jpeg/avatars/3/e/3e602dd0ab83a3a8c3f32309bb9a88f9_1460456703.jpg', '', 0),
	(5, 'Anh Không Tha Thứ', 'Đình Dũng, ACV', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/e/8/9/3/e893323f491d8c250376e428fae86705.jpg', '', 0),
	(6, 'Thằng Hầu', 'Nhật Phong', 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/cover/d/0/e/2/d0e2a18d9ace47faa25de3527174a569.jpg', '', 0),
	(7, 'Calm Waters', 'Serene Sound', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', '', 225000000),
	(8, 'Mountain Air', 'Nature Sounds', 'https://images.unsplash.com/photo-1598387993211-5c4c0fda1248?ixlib=rb-4.0.3&auto=format&fit=crop&w=776&q=80', '', 260000000),
	(9, 'Gentle Rain', 'Ambient Melody', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', '', 312000000),
	(10, 'Sunset Horizon', 'Chill Wave', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80', '', 238000000),
	(11, 'Starry Night', 'Dream Sounds', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', '', 275000000),
	(12, 'New Day', 'Fresh Beats', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', '', 200000000),
	(13, 'Echoes', 'Sound Wave', 'https://images.unsplash.com/photo-1511379936541-3b73d289c3b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', '', 250000000);

-- Dumping data for table spotify_clone.users: ~0 rows (approximately)
INSERT INTO `users` (`id`, `username`, `email`, `password`) VALUES
	(1, 'PhoePhoe', 'phoe@gmail.com', '123456');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
