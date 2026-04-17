// // frontend/src/components/UserMenu.tsx
// import React from "react";
// import { useNavigate } from "react-router-dom";

// interface UserMenuProps {
//   isLoggedIn: boolean;
//   user: { id: number; username: string; email: string; created_at?: string } | null;
//   setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
//   setUser: React.Dispatch<
//     React.SetStateAction<{
//       id: number;
//       username: string;
//       email: string;
//       created_at?: string;
//     } | null>
//   >;
//   onClose: () => void;
// }

// const UserMenu: React.FC<UserMenuProps> = ({
//   isLoggedIn,
//   user,
//   setIsLoggedIn,
//   setUser,
//   onClose,
// }) => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setIsLoggedIn(false);
//     setUser(null);
//     navigate("/");
//     onClose();
//   };

//   const handleLogin = () => {
//     navigate("/login");
//     onClose();
//   };

//   const handleAccountInfo = () => {
//     if (!isLoggedIn || !user) {
//       navigate("/login");
//     } else {
//       navigate("/profile");
//     }
//     onClose();
//   };

//   return (
//     <div className="absolute right-4 top-14 w-48 bg-[#282828] rounded-lg shadow-lg p-4 z-50">
//       {isLoggedIn && user ? (
//         <div className="space-y-2">
//           <p className="text-sm text-gray-300">{user.username}</p>
//           <p className="text-xs text-gray-400">{user.email}</p>
//           <hr className="border-gray-600" />
//           <button
//             onClick={handleAccountInfo}
//             className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
//           >
//             Thông tin tài khoản
//           </button>
//           <button
//             onClick={handleLogout}
//             className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
//           >
//             Đăng xuất
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-2">
//           <button
//             onClick={handleLogin}
//             className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
//           >
//             Đăng nhập
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserMenu;

// frontend/src/components/UserMenu.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

interface UserMenuProps {
  isLoggedIn: boolean;
  user: { id: number; username: string; email: string; created_at?: string; isPremium?: boolean } | null;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<
    React.SetStateAction<{
      id: number;
      username: string;
      email: string;
      created_at?: string;
      isPremium?: boolean;
    } | null>
  >;
  onClose: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isLoggedIn,
  user,
  setIsLoggedIn,
  setUser,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
    onClose();
  };

  const handleLogin = () => {
    navigate("/login");
    onClose();
  };

  const handleAccountInfo = () => {
    if (!isLoggedIn || !user) {
      navigate("/login");
    } else {
      navigate("/profile");
    }
    onClose();
  };
  
  const handleUpdatePass = () => {
    if (!isLoggedIn || !user) {
      navigate("/");
    } else {
      navigate("/changepass");
    }
    onClose();
  };

  return (
    <div className="absolute right-4 top-14 w-48 bg-[#282828] rounded-lg shadow-lg p-4 z-50">
      {isLoggedIn && user ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">{user.username}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-400">
            {user.isPremium ? "Premium" : "Không phải Premium"}
          </p>
          <hr className="border-gray-600" />
          <button
            onClick={handleAccountInfo}
            className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
          >
            Thông tin tài khoản
          </button>
          <button
            onClick={handleUpdatePass}
            className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
          >
            Đổi mật khẩu
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleLogin}
            className="w-full text-left text-sm text-gray-300 hover:text-white py-1"
          >
            Đăng nhập
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;