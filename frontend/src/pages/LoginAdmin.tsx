// src/pages/LoginAdmin.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const LoginAdmin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/admin";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // Đây là ví dụ, bạn thay thế bằng API thật
        if (username === "admin" && password === "admin") {
        localStorage.setItem("token", "fake-token");
        navigate(from, { replace: true });
        } else {
        alert("Sai tài khoản hoặc mật khẩu");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <form onSubmit={handleLogin} className="bg-[#181818] p-6 rounded shadow w-96 space-y-4">
            <h2 className="text-xl font-bold text-center">Đăng nhập Admin</h2>
            <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-[#282828] rounded outline-none"
            />
            <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#282828] rounded outline-none"
            />
            <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
            >
            Đăng nhập
            </button>
        </form>
        </div>
    );
};

export default LoginAdmin;
