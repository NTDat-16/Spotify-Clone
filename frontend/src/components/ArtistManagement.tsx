import { useState, useEffect } from "react";
import { Plus, Edit, Trash, RotateCcw, Save, XCircle, Mic} from "lucide-react";

interface Artist {
    id: number;
    name: string;
    status: number;
}

export default function ArtistManagement() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [newArtist, setNewArtist] = useState<{ name: string }>({ name: "" });
    const [editArtist, setEditArtist] = useState<Artist | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtistsData = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://127.0.0.1:8000/api/artists/");
                if (!response.ok) {
                    const body = await response.text();
                    throw new Error(`Không thể lấy danh sách nghệ sĩ: ${body}`);
                }
                const data: Artist[] = await response.json();
                setArtists(data);
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu:", error);
                setError(error instanceof Error ? error.message : "Lỗi không xác định");
            } finally {
                setLoading(false);
            }
        };
        fetchArtistsData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (editArtist) {
            setEditArtist({ ...editArtist, [name]: value });
        } else {
            setNewArtist({ ...newArtist, [name]: value });
        }
    };

    const submitArtistData = async (artistData: Artist | { name: string }, isEdit: boolean) => {
        try {
            const url = isEdit
                ? `http://127.0.0.1:8000/api/artists/${(artistData as Artist).id}/`
                : "http://127.0.0.1:8000/api/add-artist/";
            const method = isEdit ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(artistData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Không thể ${isEdit ? "cập nhật" : "thêm"} nghệ sĩ: ${
                        errorData.message || JSON.stringify(errorData)
                    }`
                );
            }

            const result: Artist = await response.json();
            if (isEdit) {
                setArtists((prev) =>
                    prev.map((artist) => (artist.id === result.id ? result : artist))
                );
                setEditArtist(null);
            } else {
                setArtists((prev) => [...prev, result]);
                setNewArtist({ name: "" });
            }
            setShowAddForm(false);
            setError(null);
        } catch (error) {
            console.error(`Lỗi khi ${isEdit ? "cập nhật" : "thêm"} nghệ sĩ:`, error);
            setError(error instanceof Error ? error.message : "Lỗi không xác định");
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const artistData = editArtist || newArtist;
        submitArtistData(artistData, !!editArtist);
    };

    const changeArtistStatus = async (id: number) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/artists/change/${id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Không thể cập nhật trạng thái nghệ sĩ");
            }
            const result = await response.json();
            setArtists((prev) =>
                prev.map((a) =>
                    a.id === id ? { ...a, status: result.trangThai } : a
                )
            );
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái:", error);
            setError(error instanceof Error ? error.message : "Lỗi không xác định");
        }
    };

    const handleEdit = (artist: Artist) => {
        setEditArtist(artist);
        setShowAddForm(true);
    };

    const filteredArtists = artists.filter((artist) =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Mic className="w-8 h-8 text-white" />
                <span>Quản lý nghệ sĩ</span>
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
                        setEditArtist(null);
                        setNewArtist({ name: "" });
                        setError(null);
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
                >
                    <Plus size={18} /> Thêm nghệ sĩ
                </button>
                <div className="relative w-72">
                    <input
                        type="text"
                        placeholder="Tìm kiếm nghệ sĩ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
                {loading ? (
                    <p className="text-center text-gray-400 animate-pulse">Đang tải dữ liệu...</p>
                ) : filteredArtists.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-white table-auto">
                            <thead className="sticky top-0 bg-gray-900 z-10">
                                <tr className="border-b border-gray-700 text-sm uppercase text-gray-400">
                                    <th className="p-4 w-[10%]">Mã</th>
                                    <th className="p-4 w-[40%]">Tên nghệ sĩ</th>
                                    <th className="p-4 w-[20%]">Trạng thái</th>
                                    <th className="p-4 w-[30%] text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArtists.map((artist) => (
                                    <tr
                                        key={artist.id}
                                        className="border-b border-gray-800 hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <td className="p-4">{artist.id}</td>
                                        <td className="p-4 truncate">{artist.name}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    artist.status === 1
                                                        ? "bg-green-600/20 text-green-400"
                                                        : "bg-red-600/20 text-red-400"
                                                }`}
                                            >
                                                {artist.status === 1 ? "Chưa xóa" : "Đã xóa"}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(artist)}
                                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded-lg transition-all duration-200 hover:shadow-md"
                                            >
                                                <Edit size={16} /> Sửa
                                            </button>
                                            <button
                                                onClick={() => changeArtistStatus(artist.id)}
                                                className={`flex items-center gap-1 ${
                                                    artist.status === 1
                                                        ? "bg-red-600 hover:bg-red-500"
                                                        : "bg-green-600 hover:bg-green-500"
                                                } text-white py-1 px-3 rounded-lg transition-all duration-200 hover:shadow-md`}
                                            >
                                                {artist.status === 1 ? (
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
                    <p className="text-center text-gray-400">Không tìm thấy nghệ sĩ nào</p>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 hover:scale-105">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            {editArtist ? <Edit size={20} /> : <Plus size={20} />}
                            {editArtist ? "Sửa nghệ sĩ" : "Thêm nghệ sĩ mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <InputField
                                label="Tên nghệ sĩ"
                                name="name"
                                value={editArtist ? editArtist.name : newArtist.name}
                                onChange={handleChange}
                                required
                            />
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-md"
                                >
                                    {editArtist ? (
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
                                        setEditArtist(null);
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