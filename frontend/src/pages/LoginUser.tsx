// // // frontend/src/pages/LoginUser.tsx
// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";

// // interface LoginUserProps {
// //   onLogin?: (
// //     email: string,
// //     password: string,
// //     userData: { id: number; username: string; email: string; created_at?: string }
// //   ) => void;
// //   setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
// // }

// // const API_BASE_URL = "http://localhost:8000/api";

// // const LoginUser = ({ onLogin, setIsLoggedIn }: LoginUserProps) => {
// //   const navigate = useNavigate();
// //   const [isLogin, setIsLogin] = useState(true);
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [confirmPassword, setConfirmPassword] = useState("");
// //   const [fullName, setFullName] = useState("");
// //   const [error, setError] = useState<string | null>(null);

// //   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
// //     e.preventDefault();
// //     setError(null);

// //     if (!isLogin) {
// //       if (password !== confirmPassword) {
// //         setError("Mật khẩu không khớp!");
// //         return;
// //       }
// //       if (!fullName.trim()) {
// //         setError("Vui lòng nhập họ và tên!");
// //         return;
// //       }
// //     }

// //     try {
// //       if (isLogin) {
// //         const response = await axios.post(`${API_BASE_URL}/users/login/`, {
// //           email,
// //           password,
// //         });

// //         const { user } = response.data;
// //         localStorage.setItem("token", "logged_in");
// //         localStorage.setItem("user", JSON.stringify(user));

// //         if (onLogin) onLogin(email, password, user);
// //         if (setIsLoggedIn) setIsLoggedIn(true);

// //         navigate("/");
// //       } else {
// //         await axios.post(`${API_BASE_URL}/user/add/`, {
// //           username: fullName,
// //           email: email,
// //           password_hash: password,
// //         });
// //         setIsLogin(true);
// //         setEmail("");
// //         setPassword("");
// //         setConfirmPassword("");
// //         setFullName("");
// //         alert("Đăng ký thành công! Vui lòng đăng nhập.");
// //       }
// //     } catch (error: any) {
// //       setError(
// //         error.response?.data?.error ||
// //           "Đã xảy ra lỗi. Vui lòng kiểm tra thông tin và thử lại."
// //       );
// //     }
// //   };

// //   return (
// //     <div className="w-full h-screen flex items-center justify-center bg-[#121212] text-white font-sans">
// //       <div className="w-full max-w-md p-8 bg-[#181818] rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
// //         <div className="text-center mb-10 flex flex-col items-center">
// //           <img
// //             src="../logo.png"
// //             alt="Spotify Logo"
// //             className="w-16 h-16 mb-3 transition-transform duration-300 hover:scale-110"
// //           />
// //           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent tracking-tight">
// //             Spotify
// //           </h1>
// //           <p className="text-gray-400 mt-2 text-lg font-light transition-opacity duration-300">
// //             {isLogin ? "Chào mừng trở lại!" : "Tham gia ngay hôm nay"}
// //           </p>
// //         </div>
// //         <form
// //           onSubmit={handleSubmit}
// //           className="space-y-6 transition-all duration-300 ease-in-out"
// //         >
// //           {!isLogin && (
// //             <div>
// //               <label
// //                 htmlFor="fullName"
// //                 className="block text-sm font-medium text-gray-300 mb-2"
// //               >
// //                 Họ và tên
// //               </label>
// //               <input
// //                 id="fullName"
// //                 type="text"
// //                 value={fullName}
// //                 onChange={(e) => setFullName(e.target.value)}
// //                 className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
// //                 placeholder="Nhập họ và tên của bạn"
// //                 required
// //               />
// //             </div>
// //           )}
// //           <div>
// //             <label
// //               htmlFor="email"
// //               className="block text-sm font-medium text-gray-300 mb-2"
// //             >
// //               Email
// //             </label>
// //             <input
// //               id="email"
// //               type="email"
// //               value={email}
// //               onChange={(e) => setEmail(e.target.value)}
// //               className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
// //               placeholder="Nhập email của bạn"
// //               required
// //             />
// //           </div>
// //           <div>
// //             <label
// //               htmlFor="password"
// //               className="block text-sm font-medium text-gray-300 mb-2"
// //             >
// //               Mật khẩu
// //             </label>
// //             <input
// //               id="password"
// //               type="password"
// //               value={password}
// //               onChange={(e) => setPassword(e.target.value)}
// //               className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
// //               placeholder="Nhập mật khẩu của bạn"
// //               required
// //             />
// //           </div>
// //           {!isLogin && (
// //             <div>
// //               <label
// //                 htmlFor="confirmPassword"
// //                 className="block text-sm font-medium text-gray-300 mb-2"
// //               >
// //                 Xác nhận mật khẩu
// //               </label>
// //               <input
// //                 id="confirmPassword"
// //                 type="password"
// //                 value={confirmPassword}
// //                 onChange={(e) => setConfirmPassword(e.target.value)}
// //                 className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
// //                 placeholder="Xác nhận mật khẩu của bạn"
// //                 required
// //               />
// //             </div>
// //           )}
// //           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
// //           <div>
// //             <button
// //               type="submit"
// //               className="w-full py-3 px-4 bg-[#1DB954] text-black font-semibold rounded-full shadow-md hover:bg-[#1ED760] focus:ring-4 focus:ring-[#1DB954]/50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
// //             >
// //               {isLogin ? "Đăng nhập" : "Đăng ký"}
// //             </button>
// //           </div>
// //         </form>
// //         <div className="mt-8 text-center">
// //           <button
// //             onClick={() => setIsLogin(!isLogin)}
// //             className="text-sm text-gray-400 hover:text-[#1DB954] font-medium transition-colors duration-200 ease-in-out"
// //           >
// //             {isLogin
// //               ? "Chưa có tài khoản? Đăng ký ngay"
// //               : "Đã có tài khoản? Đăng nhập"}
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default LoginUser;

// // frontend/src/pages/LoginUser.tsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// interface LoginUserProps {
//   onLogin?: (
//     email: string,
//     password: string,
//     userData: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean }
//   ) => void;
//   setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const API_BASE_URL = "http://localhost:8000/api";

// const LoginUser = ({ onLogin, setIsLoggedIn }: LoginUserProps) => {
//   const navigate = useNavigate();
//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError(null);

//     if (!isLogin) {
//       if (password !== confirmPassword) {
//         setError("Mật khẩu không khớp!");
//         return;
//       }
//       if (!fullName.trim()) {
//         setError("Vui lòng nhập họ và tên!");
//         return;
//       }
//     }

//     try {
//       if (isLogin) {
//         const response = await axios.post(`${API_BASE_URL}/users/login/`, {
//           email,
//           password,
//         });

//         const { user } = response.data;
//         user.isPremium = user.isPremium === 1; // Chuyển 0/1 thành false/true
//         localStorage.setItem("token", "logged_in");
//         localStorage.setItem("user", JSON.stringify(user));

//         if (onLogin) onLogin(email, password, user);
//         if (setIsLoggedIn) setIsLoggedIn(true);

//         navigate("/");
//       } else {
//         await axios.post(`${API_BASE_URL}/user/add/`, {
//           username: fullName,
//           email: email,
//           password_hash: password,
//         });
//         setIsLogin(true);
//         setEmail("");
//         setPassword("");
//         setConfirmPassword("");
//         setFullName("");
//         alert("Đăng ký thành công! Vui lòng đăng nhập.");
//       }
//     } catch (error: any) {
//       setError(
//         error.response?.data?.error ||
//           "Đã xảy ra lỗi. Vui lòng kiểm tra thông tin và thử lại."
//       );
//     }
//   };

//   return (
//     <div className="w-full h-screen flex items-center justify-center bg-[#121212] text-white font-sans">
//       <div className="w-full max-w-md p-8 bg-[#181818] rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
//         <div className="text-center mb-10 flex flex-col items-center">
//           <img
//             src="../logo.png"
//             alt="Spotify Logo"
//             className="w-16 h-16 mb-3 transition-transform duration-300 hover:scale-110"
//           />
//           <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent tracking-tight">
//             Spotify
//           </h1>
//           <p className="text-gray-400 mt-2 text-lg font-light transition-opacity duration-300">
//             {isLogin ? "Chào mừng trở lại!" : "Tham gia ngay hôm nay"}
//           </p>
//         </div>
//         <form
//           onSubmit={handleSubmit}
//           className="space-y-6 transition-all duration-300 ease-in-out"
//         >
//           {!isLogin && (
//             <div>
//               <label
//                 htmlFor="fullName"
//                 className="block text-sm font-medium text-gray-300 mb-2"
//               >
//                 Họ và tên
//               </label>
//               <input
//                 id="fullName"
//                 type="text"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//                 className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
//                 placeholder="Nhập họ và tên của bạn"
//                 required
//               />
//             </div>
//           )}
//           <div>
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-gray-300 mb-2"
//             >
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
//               placeholder="Nhập email của bạn"
//               required
//             />
//           </div>
//           <div>
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-gray-300 mb-2"
//             >
//               Mật khẩu
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
//               placeholder="Nhập mật khẩu của bạn"
//               required
//             />
//           </div>
//           {!isLogin && (
//             <div>
//               <label
//                 htmlFor="confirmPassword"
//                 className="block text-sm font-medium text-gray-300 mb-2"
//               >
//                 Xác nhận mật khẩu
//               </label>
//               <input
//                 id="confirmPassword"
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
//                 placeholder="Xác nhận mật khẩu của bạn"
//                 required
//               />
//             </div>
//           )}
//           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
//           <div>
//             <button
//               type="submit"
//               className="w-full py-3 px-4 bg-[#1DB954] text-black font-semibold rounded-full shadow-md hover:bg-[#1ED760] focus:ring-4 focus:ring-[#1DB954]/50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
//             >
//               {isLogin ? "Đăng nhập" : "Đăng ký"}
//             </button>
//           </div>
//         </form>
//         <div className="mt-8 text-center">
//           <button
//             onClick={() => setIsLogin(!isLogin)}
//             className="text-sm text-gray-400 hover:text-[#1DB954] font-medium transition-colors duration-200 ease-in-out"
//           >
//             {isLogin
//               ? "Chưa có tài khoản? Đăng ký ngay"
//               : "Đã có tài khoản? Đăng nhập"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginUser;

// frontend/src/pages/LoginUser.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface LoginUserProps {
  onLogin?: (
    email: string,
    password: string,
    userData: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean }
  ) => void;
  setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
}

const API_BASE_URL = "http://localhost:8000/api";

const LoginUser = ({ onLogin, setIsLoggedIn }: LoginUserProps) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Mật khẩu không khớp!");
        return;
      }
      if (!fullName.trim()) {
        setError("Vui lòng nhập họ và tên!");
        return;
      }
    }

    try {
      if (isLogin) {
        const response = await axios.post(`${API_BASE_URL}/users/login/`, {
          email,
          password,
        });

        const { user } = response.data;
        console.log("User data from API (login):", user); // Log để kiểm tra
        user.isPremium = Number(user.isPremium) === 1 // Chuyển 0/1 thành false/true
        localStorage.setItem("token", "logged_in");
        localStorage.setItem("user", JSON.stringify(user));

        if (onLogin) onLogin(email, password, user);
        if (setIsLoggedIn) setIsLoggedIn(true);

        navigate("/");
      } else {
        await axios.post(`${API_BASE_URL}/user/add/`, {
          username: fullName,
          email: email,
          password_hash: password,
          isPremium: 0
        });
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Đã xảy ra lỗi. Vui lòng kiểm tra thông tin và thử lại."
      );
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#121212] text-white font-sans">
      <div className="w-full max-w-md p-8 bg-[#181818] rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-10 flex flex-col items-center">
          <img
            src="../logo.png"
            alt="Spotify Logo"
            className="w-16 h-16 mb-3 transition-transform duration-300 hover:scale-110"
          />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent tracking-tight">
            Spotify
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-light transition-opacity duration-300">
            {isLogin ? "Chào mừng trở lại!" : "Tham gia ngay hôm nay"}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 transition-all duration-300 ease-in-out"
        >
          {!isLogin && (
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Họ và tên
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
                placeholder="Nhập họ và tên của bạn"
                required
              />
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
              placeholder="Nhập email của bạn"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
              placeholder="Nhập mật khẩu của bạn"
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#282828] text-white border border-[#383838] rounded-lg shadow-sm focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all duration-200 ease-in-out placeholder-gray-500 hover:bg-[#303030]"
                placeholder="Xác nhận mật khẩu của bạn"
                required
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1DB954] text-black font-semibold rounded-full shadow-md hover:bg-[#1ED760] focus:ring-4 focus:ring-[#1DB954]/50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
            >
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </button>
          </div>
        </form>
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-[#1DB954] font-medium transition-colors duration-200 ease-in-out"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký ngay"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginUser;