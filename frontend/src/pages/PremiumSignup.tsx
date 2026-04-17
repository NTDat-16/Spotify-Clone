// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// interface PremiumSignupProps {
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

// const PremiumSignup: React.FC<PremiumSignupProps> = ({ user, setUser }) => {
//   const navigate = useNavigate();
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//     } else if (user.isPremium) {
//       navigate("/profile");
//     }
//   }, [user, navigate]);

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
//       setSuccess("Đăng ký Premium thành công! Bạn sẽ được chuyển hướng...");
//       setTimeout(() => navigate("/profile"), 2000); // Chuyển hướng sau 2 giây
//     } catch (err: any) {
//       setError(
//         err.response?.data?.error ||
//           "Đã xảy ra lỗi khi đăng ký Premium. Vui lòng thử lại."
//       );
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="p-6 bg-[#121212] text-white min-h-screen flex items-center justify-center">
//       <div className="max-w-md w-full bg-[#181818] p-8 rounded-2xl shadow-lg">
//         <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent">
//           Đăng ký Premium
//         </h2>
//         {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
//         {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}
//         <div className="space-y-4">
//           <div>
//             <p className="text-lg font-semibold mb-2">Lợi ích của Premium:</p>
//             <ul className="list-disc list-inside text-gray-300 space-y-1">
//               <li>Nghe nhạc không quảng cáo</li>
//               <li>Tải nhạc để nghe ngoại tuyến</li>
//               <li>Truy cập nội dung độc quyền</li>
//             </ul>
//           </div>
//           <button
//             onClick={handleUpgradeToPremium}
//             className="w-full py-3 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ED760] transition-all"
//           >
//             Đăng ký Premium
//           </button>
//           <button
//             onClick={() => navigate("/profile")}
//             className="w-full py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-all mt-2"
//           >
//             Quay lại
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PremiumSignup;


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface PremiumSignupProps {
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

const PremiumSignup: React.FC<PremiumSignupProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.isPremium) {
      navigate("/profile");
    }
  }, [user, navigate]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=AY5SLnZXMLzSQwqlHiq1fI3x5HhGR994zmFQqXxUOkFng9WV50Lg3hZerAv9pa5NFvmgLliOqTTowgmW&currency=USD`;
    script.async = true;
    script.onload = () => {
      if (window.paypal) {
        window.paypal
          .Buttons({
            createOrder: async () => {
              try {
                const response = await axios.post(
                  "http://localhost:8000/api/paypal/create/",
                  {},
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                    withCredentials: true,
                  }
                );
                const orderId = response.data.approval_url.split("token=")[1];
                if (!orderId) {
                  throw new Error("Không nhận được order ID từ server");
                }
                return orderId;
              } catch (err: any) {
                const errorMessage = err.response?.status === 404
                  ? "Không tìm thấy endpoint thanh toán. Vui lòng kiểm tra backend."
                  : err.response?.data?.error || err.message || "Lỗi không xác định";
                setError("Không thể tạo thanh toán: " + errorMessage);
                throw new Error(errorMessage);
              }
            },
            onApprove: async (data: { orderID: string; payerID: string }) => {
              try {
                const response = await axios.post(
                  "http://localhost:8000/api/paypal/execute/",
                  { paymentId: data.orderID, PayerID: data.payerID },
                  { 
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    withCredentials: true,
                  }
                );
                if (response.data.status === "success") {
                  const updatedUser = { ...user!, isPremium: true };
                  setUser(updatedUser);
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  setSuccess("Đăng ký Premium thành công! Bạn sẽ được chuyển hướng...");
                  setTimeout(() => navigate("/profile"), 2000);
                }
              } catch (err: any) {
                setError("Thanh toán thất bại: " + (err.response?.data?.error || err.message));
              }
            },
            onCancel: () => {
              setError("Thanh toán đã bị hủy.");
            },
            onError: (err: any) => {
              setError("Đã xảy ra lỗi với PayPal: " + err.message);
            },
          })
          .render("#paypal-button-container");
      } else {
        setError("Không thể tải PayPal SDK. Vui lòng thử lại.");
      }
    };
    script.onerror = () => {
      setError("Không thể tải PayPal SDK. Vui lòng kiểm tra kết nối mạng hoặc Client ID.");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [navigate, user, setUser]);

  if (!user) return null;

  return (
    <div className="p-6 bg-[#121212] text-white min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-[#181818] p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-[#1DB954] to-[#1ED760] bg-clip-text text-transparent">
          Đăng ký Premium
        </h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold mb-2">Lợi ích của Premium:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Nghe nhạc không quảng cáo</li>
              <li>Tải nhạc để nghe ngoại tuyến</li>
              <li>Truy cập nội dung độc quyền</li>
            </ul>
          </div>
          <div id="paypal-button-container"></div>
          <button
            onClick={() => navigate("/profile")}
            className="w-full py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-all mt-2"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumSignup;