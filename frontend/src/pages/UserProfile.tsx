
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// interface UserProfileProps {
//   user: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean } | null;
//   setUser: React.Dispatch<
//     React.SetStateAction<{
//       id: number;
//       username: string;
//       email: string;
//       created_at?: string;
//       isPremium?: boolean;
//     } | null>
//   >;
// }

// const UserProfile: React.FC<UserProfileProps> = ({ user, setUser }) => {
//   const navigate = useNavigate();
//   const [isEditing, setIsEditing] = useState(false);
//   const [username, setUsername] = useState(user?.username || "");
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//     }
//     console.log("User in UserProfile:", user); // Log để kiểm tra dữ liệu user
//   }, [user, navigate]);

//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     if (!user) return;

//     try {
//       const response = await axios.put(
//         `http://localhost:8000/api/users/${user.id}/`,
//         {
//           username,
//           email: user.email,
//           password_hash: "",
//         }
//       );
//       setUser(response.data);
//       localStorage.setItem("user", JSON.stringify(response.data));
//       setSuccess("Cập nhật thông tin thành công!");
//       setIsEditing(false);
//     } catch (err: any) {
//       setError(
//         err.response?.data?.error ||
//           "Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại."
//       );
//     }
//   };

//   const handleUpgradeToPremium = async () => {
//     if (!user) return;

//     try {
//       const response = await axios.put(
//         `http://localhost:8000/api/users/${user.id}/`,
//         {
//           isPremium: true,
//         }
//       );
//       const updatedUser = response.data;
//       updatedUser.isPremium = Number(updatedUser.isPremium) === 1; // Chuyển đổi 0/1 thành false/true
//       setUser(updatedUser);
//       localStorage.setItem("user", JSON.stringify(updatedUser));
//       setSuccess("Đăng ký Premium thành công!");
//     } catch (err: any) {
//       setError(
//         err.response?.data?.error ||
//           "Đã xảy ra lỗi khi đăng ký Premium. Vui lòng thử lại."
//       );
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="p-6 bg-[#121212] text-white min-h-screen">
//       <div className="max-w-4xl mx-auto flex gap-6">
//         {/* Phần đăng ký Premium (bên trái) - Ẩn nếu đã là Premium */}
//         {!user.isPremium && (
//           <div className="w-1/2 bg-[#181818] p-6 rounded-2xl shadow-lg">
//             <h2 className="text-xl font-bold mb-8 text-center bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent ">
//               Đăng ký Premium
//             </h2>
//             <div className="space-y-20">
//               <div>
//                 <p className="text-md font-semibold mb-6">Lợi ích của Premium:</p>
//                 <ul className="list-disc list-inside text-gray-300 space-y-5 text-sm">
//                   <li>Nghe nhạc không quảng cáo</li>
//                   <li>Chất lượng âm thanh cao hơn</li>
//                   <li>Tải nhạc để nghe ngoại tuyến</li>
//                   <li>Truy cập nội dung độc quyền</li>
//                 </ul>
//               </div>
//               <button
//                 onClick={handleUpgradeToPremium}
//                 className="w-full py-2 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
//               >
//                 Đăng ký ngay
//               </button>
//             </div>
//           </div>
//         )}
//         {/* Phần thông tin tài khoản (bên phải) */}
//         <div className={`${user.isPremium ? "w-full" : "w-1/2"} bg-[#181818] p-8 rounded-2xl shadow-lg`}>
//           <h2 className="text-2xl font-bold mb-6 text-center">Thông tin tài khoản</h2>
//           {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
//           {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
//           <div className="space-y-4">
//             {isEditing ? (
//               <form onSubmit={handleUpdate} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">
//                     Tên người dùng
//                   </label>
//                   <input
//                     type="text"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all"
//                     placeholder="Nhập tên người dùng"
//                     required
//                   />
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     type="submit"
//                     className="flex-1 py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
//                   >
//                     Lưu
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsEditing(false);
//                       setUsername(user.username);
//                     }}
//                     className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-all"
//                   >
//                     Hủy
//                   </button>
//                 </div>
//               </form>
//             ) : (
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300">
//                     Tên người dùng
//                   </label>
//                   <p className="text-lg">{user.username}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300">
//                     Email
//                   </label>
//                   <p className="text-lg">{user.email}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300">
//                     Ngày tạo tài khoản
//                   </label>
//                   <p className="text-lg">
//                     {user.created_at
//                       ? new Date(user.created_at).toLocaleDateString()
//                       : "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300">
//                     Trạng thái Premium
//                   </label>
//                   <p className="text-lg">
//                     {user.isPremium ? "Premium" : "Không phải Premium"}
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsEditing(true)}
//                   className="w-full py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
//                 >
//                   Chỉnh sửa
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserProfile;


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface UserProfileProps {
  user: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean } | null;
  setUser: React.Dispatch<
    React.SetStateAction<{
      id: number;
      username: string;
      email: string;
      created_at?: string;
      isPremium?: boolean;
    } | null>
  >;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    console.log("User in UserProfile:", user);
  }, [user, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) return;

    try {
      const response = await axios.put(
        `http://localhost:8000/api/users/${user.id}/`,
        {
          username,
          email: user.email,
          password_hash: "",
        }
      );
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      setSuccess("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại."
      );
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 bg-[#121212] text-white min-h-screen">
      <div className="max-w-4xl mx-auto flex gap-6">
        {!user.isPremium && (
          <div className="w-1/2 bg-[#181818] p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-8 text-center bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent">
              Đăng ký Premium
            </h2>
            <div className="space-y-20">
              <div>
                <p className="text-md font-semibold mb-6">Lợi ích của Premium:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-5 text-sm">
                  <li>Nghe nhạc không quảng cáo</li>
                  <li>Chất lượng âm thanh cao hơn</li>
                  <li>Tải nhạc để nghe ngoại tuyến</li>
                  <li>Truy cập nội dung độc quyền</li>
                </ul>
              </div>
              <button
                onClick={() => navigate("/premium")}
                className="w-full py-2 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        )}
        <div className={`${user.isPremium ? "w-full" : "w-1/2"} bg-[#181818] p-8 rounded-2xl shadow-lg`}>
          <h2 className="text-2xl font-bold mb-6 text-center">Thông tin tài khoản</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
          <div className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên người dùng
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all"
                    placeholder="Nhập tên người dùng"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(user.username);
                    }}
                    className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Tên người dùng
                  </label>
                  <p className="text-lg">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Ngày tạo tài khoản
                  </label>
                  <p className="text-lg">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Trạng thái Premium
                  </label>
                  <p className="text-lg">
                    {user.isPremium ? "Premium" : "Không phải Premium"}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
                >
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;