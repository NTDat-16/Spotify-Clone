import { useEffect, useState } from "react";
import { Disc3, Lock, Unlock } from "lucide-react";

// Lấy danh sách người dùng
const fetchUsersData = async (setUsers: Function, setLoading: Function) => {
    setLoading(true);
    try {
        const res = await fetch("http://127.0.0.1:8000/api/users/");
        const body = await res.text();
        if (!res.ok) throw new Error(`Không thể lấy danh sách người dùng: ${body}`);
        setUsers(JSON.parse(body));
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
        setLoading(false);
    }
};

// Toggle trạng thái người dùng (mở/khóa)
const toggleUserStatus = async (id: number, setUsers: Function) => {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/users/${id}/toggle-status/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
        });

        const text = await res.text();
        console.log("Raw response:", text); // Debug phản hồi thô

        if (!res.ok) {
            throw new Error(`Không thể thay đổi trạng thái: ${text}`);
        }

        const updatedUser = JSON.parse(text);
        setUsers((prev: any[]) =>
            prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
    } catch (error) {
        alert(`Lỗi: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/users/");
            const users = await res.json();
            setUsers(users);
        } catch (fetchErr) {
            console.error("Lỗi khi reload danh sách:", fetchErr);
        }
    }
};

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const BASE_URL = "http://127.0.0.1:8000";

    useEffect(() => {
        fetchUsersData(setUsers, setLoading);
    }, []);

    const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Disc3 className="w-8 h-8 text-white" />
                <span>Quản lý người dùng</span>
            </h1>

            {error && (
                <div className="mb-6 p-4 bg-red-600/10 border border-red-600 text-red-200 rounded-lg animate-fade-in">
                    {error}
                </div>
            )}

            <div className="flex justify-between mb-8">
                <div className="relative w-72">
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
                {loading ? (
                    <p className="text-center text-gray-400 animate-pulse">Đang tải dữ liệu...</p>
                ) : filteredUsers.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-white table-auto">
                            <thead className="sticky top-0 bg-gray-900 z-10">
                                <tr className="border-b border-gray-700 text-sm uppercase text-gray-400">
                                    <th className="p-4 w-[10%]">ID</th>
                                    <th className="p-4 w-[25%]">Tên đăng nhập</th>
                                    <th className="p-4 w-[30%]">Email</th>
                                    <th className="p-4 w-[15%]">Trạng thái</th>
                                    <th className="p-4 w-[20%] text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-800 hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <td className="p-4">{user.id}</td>
                                        <td className="p-4 truncate">{user.username}</td>
                                        <td className="p-4 truncate">{user.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    user.status === 1
                                                        ? "bg-green-600/20 text-green-400"
                                                        : "bg-red-600/20 text-red-400"
                                                }`}
                                            >
                                                {user.status === 1 ? "Chưa Khóa" : "Đã Khóa"}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, setUsers)}
                                                className={`flex items-center gap-1 ${
                                                    user.status === 1
                                                        ? "bg-red-600 hover:bg-red-500"
                                                        : "bg-green-600 hover:bg-green-500"
                                                } text-white py-1 px-3 rounded-lg transition-all duration-200 hover:shadow-md`}
                                            >
                                                {user.status === 1 ? (
                                                    <>
                                                        <Lock size={16} /> Khóa
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock size={16} /> Mở khóa
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
                    <p className="text-center text-gray-400">Không tìm thấy người dùng nào</p>
                )}
            </div>
        </div>
    );
}