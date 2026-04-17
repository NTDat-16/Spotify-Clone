import { useState, useEffect } from "react";
import { Plus, Edit, Trash, RotateCcw, Save, XCircle, Disc3 } from "lucide-react";

interface Artist {
    id: number;
    name: string;
    status: number;
}

interface Album {
    id: number;
    name: string;
    created_at: string;
    artist: number;
    cover_image?: string | null;
    status: number;
}

// Kiểu dữ liệu chung cho cả thêm và sửa
interface AlbumFormData {
    name: string;
    created_at: string;
    artist: number | null;
    cover_image?: File | string | null;
    status: number;
}

export default function Album() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albumsList, setAlbums] = useState<Album[]>([]);
    const [newAlbum, setNewAlbum] = useState<AlbumFormData>({
        name: "",
        created_at: new Date().toISOString().split("T")[0],
        artist: null,
        cover_image: null,
        status: 1,
    });
    const [editAlbum, setEditAlbum] = useState<AlbumFormData | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const BASE_URL = "http://127.0.0.1:8000";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const artistsResponse = await fetch(`${BASE_URL}/api/artists/`);
                if (!artistsResponse.ok) {
                    const body = await artistsResponse.text();
                    throw new Error(`Không thể lấy danh sách nghệ sĩ: ${body}`);
                }
                const artistsData: Artist[] = await artistsResponse.json();
                const activeArtists = artistsData.filter(artist => artist.status === 1);
                setArtists(activeArtists);

                const albumsResponse = await fetch(`${BASE_URL}/api/albums/`);
                if (!albumsResponse.ok) {
                    const body = await albumsResponse.text();
                    throw new Error(`Không thể lấy danh sách album: ${body}`);
                }
                const albumsData: Album[] = await albumsResponse.json();
                setAlbums(albumsData);
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu:", error);
                setError(error instanceof Error ? error.message : "Lỗi không xác định");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (editAlbum) {
            setEditAlbum({ ...editAlbum, [name]: name === "artist" ? Number(value) : value });
        } else {
            setNewAlbum({ ...newAlbum, [name]: name === "artist" ? Number(value) : value });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (editAlbum) {
                setEditAlbum({ ...editAlbum, cover_image: file });
            } else {
                setNewAlbum({ ...newAlbum, cover_image: file });
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            if (editAlbum) {
                setEditAlbum({ ...editAlbum, cover_image: null });
            } else {
                setNewAlbum({ ...newAlbum, cover_image: null });
            }
            setCoverImagePreview(null);
        }
    };

    const submitAlbumData = async (albumData: AlbumFormData, isEdit: boolean) => {
        try {
            const url = isEdit
                ? `${BASE_URL}/api/albums/update/${(albumData as Album).id}/`
                : `${BASE_URL}/api/albums/add/`;
            const method = isEdit ? "PUT" : "POST";

            const formData = new FormData();
            formData.append("name", albumData.name);
            formData.append("created_at", albumData.created_at);
            if (albumData.artist === null) {
                throw new Error("Nghệ sĩ không được để trống");
            }
            formData.append("artist", String(albumData.artist));
            formData.append("status", String(albumData.status));
            if (albumData.cover_image instanceof File) {
                formData.append("cover_image", albumData.cover_image);
            }

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage = `Không thể ${isEdit ? "cập nhật" : "thêm"} album: `;
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage += errorData.error || JSON.stringify(errorData);
                } else {
                    const body = await response.text();
                    errorMessage += `Server trả về lỗi không phải JSON: ${body.slice(0, 200)}...`;
                }
                throw new Error(errorMessage);
            }

            const result: Album = await response.json();
            console.log("API response:", result);
            if (isEdit) {
                setAlbums((prev) =>
                    prev.map((album) => (album.id === result.id ? result : album))
                );
                setEditAlbum(null);
            } else {
                setAlbums((prev) => [...prev, result]);
                setNewAlbum({
                    name: "",
                    created_at: new Date().toISOString().split("T")[0],
                    artist: null,
                    cover_image: null,
                    status: 1,
                });
                setCoverImagePreview(null);
            }
            setShowAddForm(false);
            setError(null);
        } catch (error) {
            console.error(`Lỗi khi ${isEdit ? "cập nhật" : "thêm"} album:`, error);
            setError(error instanceof Error ? error.message : "Lỗi không xác định");
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const albumData = editAlbum || newAlbum;
        if (!albumData.artist) {
            setError("Vui lòng chọn một nghệ sĩ!");
            return;
        }
        submitAlbumData(albumData, !!editAlbum);
    };

    const changeAlbumStatus = async (id: number) => {
        try {
            const response = await fetch(`${BASE_URL}/api/albums/change/${id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Không thể cập nhật trạng thái album");
            }
            const result = await response.json();
            setAlbums((prev) =>
                prev.map((a) =>
                    a.id === id ? { ...a, status: result.trangThai } : a
                )
            );
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái:", error);
            setError(error instanceof Error ? error.message : "Lỗi không xác định");
        }
    };

    const handleEdit = (album: Album) => {
        setEditAlbum({ ...album, cover_image: album.cover_image }); // Chuyển từ Album sang AlbumFormData
        setCoverImagePreview(
            album.cover_image ? `/uploads/albums/${album.cover_image}` : null
        );
        setShowAddForm(true);
    };

    const filteredAlbum = albumsList.filter((album) =>
        album.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getArtistName = (artistId: number) => {
        const artist = artists.find((a) => a.id === artistId);
        return artist ? artist.name : "Không xác định";
    };

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Disc3 className="w-8 h-8 text-white" />
                <span>Quản lý album</span>
            </h1>

            {error && (
                <div className="mb-6 p-4 bg-red-600/10 border border-red-600 text-red-200 rounded-lg animate-fade-in">
                    {error}
                </div>
            )}

            <div className="flex justify-between mb-8">
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditAlbum(null);
                        setNewAlbum({
                            name: "",
                            created_at: new Date().toISOString().split("T")[0],
                            artist: null,
                            cover_image: null,
                            status: 1,
                        });
                        setCoverImagePreview(null);
                        setError(null);
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
                >
                    <Plus size={18} /> Thêm album
                </button>
                <div className="relative w-72">
                    <input
                        type="text"
                        placeholder="Tìm kiếm album..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
                {loading ? (
                    <p className="text-center text-gray-400 animate-pulse">Đang tải dữ liệu...</p>
                ) : filteredAlbum.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-white table-auto">
                            <thead className="sticky top-0 bg-gray-900 z-10">
                                <tr className="border-b border-gray-700 text-sm uppercase text-gray-400">
                                    <th className="p-4 w-[10%]">Mã</th>
                                    <th className="p-4 w-[20%]">Tên album</th>
                                    <th className="p-4 w-[15%]">Ngày tạo</th>
                                    <th className="p-4 w-[15%]">Ảnh</th>
                                    <th className="p-4 w-[15%]">Nghệ sĩ</th>
                                    <th className="p-4 w-[15%]">Trạng thái</th>
                                    <th className="p-4 w-[20%] text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlbum.map((album) => (
                                    <tr
                                        key={album.id}
                                        className="border-b border-gray-800 hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <td className="p-4">{album.id}</td>
                                        <td className="p-4 truncate">{album.name}</td>
                                        <td className="p-4">{album.created_at}</td>
                                        <td className="p-4">
                                            {album.cover_image ? (
                                                <img
                                                    src={`/uploads/albums/${album.cover_image}`}
                                                    alt={album.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            ) : (
                                                "Không có ảnh"
                                            )}
                                        </td>
                                        <td className="p-4">{getArtistName(album.artist)}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    album.status === 1
                                                        ? "bg-green-600/20 text-green-400"
                                                        : "bg-red-600/20 text-red-400"
                                                }`}
                                            >
                                                {album.status === 1 ? "Chưa xóa" : "Đã xóa"}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(album)}
                                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded-lg transition-all duration-200 hover:shadow-md"
                                            >
                                                <Edit size={16} /> Sửa
                                            </button>
                                            <button
                                                onClick={() => changeAlbumStatus(album.id)}
                                                className={`flex items-center gap-1 ${
                                                    album.status === 1
                                                        ? "bg-red-600 hover:bg-red-500"
                                                        : "bg-green-600 hover:bg-green-500"
                                                } text-white py-1 px-3 rounded-lg transition-all duration-200 hover:shadow-md`}
                                            >
                                                {album.status === 1 ? (
                                                    <>
                                                        <Trash size={16} /> Xóa
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw size={16} /> Khôi phục
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-400">Không tìm thấy album nào</p>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 hover:scale-105">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            {editAlbum ? <Edit size={20} /> : <Plus size={20} />}
                            {editAlbum ? "Sửa album" : "Thêm album mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <InputField
                                label="Tên album"
                                name="name"
                                value={editAlbum ? editAlbum.name : newAlbum.name}
                                onChange={handleChange}
                                required
                            />
                            <InputField
                                label="Ngày tạo"
                                name="created_at"
                                type="date"
                                value={editAlbum ? editAlbum.created_at : newAlbum.created_at}
                                onChange={handleChange}
                                required
                            />
                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-300">Nghệ sĩ</label>
                                <select
                                    name="artist"
                                    // value={editAlbum ? editAlbum.artist : newAlbum.artist || ""}
                                    value={editAlbum ? (editAlbum.artist ?? "") : (newAlbum.artist ?? "")}
                                    onChange={handleChange}
                                    className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                                    required
                                >
                                    <option value="" disabled>
                                        Chọn nghệ sĩ
                                    </option>
                                    {artists.map((artist) => (
                                        <option key={artist.id} value={artist.id}>
                                            {artist.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-300">Ảnh bìa</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                                />
                                {editAlbum && typeof editAlbum.cover_image === "string" && !coverImagePreview && (
                                    <p className="mt-2 text-gray-400">
                                        Ảnh hiện tại: {editAlbum.cover_image}
                                    </p>
                                )}
                                {coverImagePreview && (
                                    <img
                                        src={coverImagePreview}
                                        alt="Preview"
                                        className="mt-2 w-24 h-24 object-cover rounded"
                                    />
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-md"
                                >
                                    {editAlbum ? (
                                        <>
                                            <Save size={16} /> Lưu
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} /> Thêm
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditAlbum(null);
                                        setCoverImagePreview(null);
                                        setError(null);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-md"
                                >
                                    <XCircle size={18} /> Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    type?: string;
}

function InputField({ label, name, value, onChange, required, type = "text" }: InputFieldProps) {
    return (
        <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-300">{label}</label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                required={required}
                className="p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                placeholder={label}
            />
        </div>
    );
}