import React, { useState, useEffect } from "react";
import { API_ORIGIN } from "../config/api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Zap,
  Music,
  Crown,
  ChevronRight,
  Headphones,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface PremiumSignupProps {
  user: {
    id: number;
    username: string;
    email: string;
    created_at?: string;
    isPremium?: boolean;
  } | null;
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

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "student",
    name: "Gói Sinh Viên",
    price: "29.500₫",
    period: "/ tháng",
    desc: "Ưu đãi 50% dành riêng cho học sinh, sinh viên các trường đại học.",
    features: [
      "1 tài khoản Premium đã xác minh",
      "Giảm giá 50% học phí gói nghe nhạc",
      "Âm thanh chất lượng cao 320kbps",
      "Mở khóa toàn bộ bài hát bản quyền",
    ],
  },
  {
    id: "individual",
    name: "Gói Cá Nhân (VIP)",
    price: "59.000₫",
    period: "/ tháng",
    desc: "Gói nghe nhạc cao cấp phổ biến nhất được hàng triệu người tin dùng.",
    badge: "PHỔ BIẾN NHẤT",
    highlight: true,
    features: [
      "1 tài khoản Premium cá nhân",
      "Nghe mọi bản hit độc quyền không giới hạn",
      "Trợ lý Spotify AI DJ toàn quyền",
      "Âm thanh Lossless chuẩn phòng thu",
      "Không quảng cáo, chuyển bài không giới hạn",
      "Hỗ trợ cả thanh toán PayPal & Kích hoạt Demo",
    ],
  },
  {
    id: "family",
    name: "Gói Gia Đình",
    price: "89.000₫",
    period: "/ tháng",
    desc: "Dành cho tối đa 6 thành viên trong cùng gia đình.",
    badge: "TIẾT KIỆM",
    features: [
      "Tối đa 6 tài khoản Premium riêng biệt",
      "Playlist gia đình cập nhật tự động",
      "Chặn nội dung nhạy cảm cho trẻ em",
      "Tiết kiệm chi phí vượt trội",
    ],
  },
];

const PremiumSignup: React.FC<PremiumSignupProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("individual");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"instant" | "paypal">("instant");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Khởi tạo PayPal SDK khi chọn phương thức PayPal
  useEffect(() => {
    if (paymentMethod !== "paypal" || !user || user.isPremium) return;

    const paypalClientId =
      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
      "AY5SLnZXMLzSQwqlHiq1fI3x5HhGR994zmFQqXxUOkFng9WV50Lg3hZerAv9pa5NFvmgLliOqTTowgmW";

    const container = document.getElementById("paypal-button-container");
    if (!container) return;
    container.innerHTML = ""; // Clear existing buttons

    const scriptId = "paypal-jssdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const renderPayPalButtons = () => {
      if (!window.paypal || !document.getElementById("paypal-button-container")) return;
      try {
        window.paypal
          .Buttons({
            createOrder: async () => {
              try {
                const response = await axios.post(
                  `${API_ORIGIN}/api/paypal/create/`,
                  {},
                  {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                  }
                );
                const orderId = response.data?.approval_url?.split("token=")[1];
                if (!orderId) throw new Error("Không nhận được token thanh toán từ PayPal");
                return orderId;
              } catch (err: any) {
                const msg = err.response?.data?.error || err.message || "Lỗi tạo đơn PayPal";
                setError(msg);
                throw new Error(msg);
              }
            },
            onApprove: async (data: { orderID: string; payerID: string }) => {
              try {
                setLoading(true);
                const response = await axios.post(
                  `${API_ORIGIN}/api/paypal/execute/`,
                  { paymentId: data.orderID, PayerID: data.payerID, user_id: user.id },
                  {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                  }
                );
                if (response.data?.status === "success") {
                  handleUpgradeSuccess("Thanh toán PayPal thành công! Chúc mừng bạn đã lên Spotify Premium.");
                }
              } catch (err: any) {
                setError("Xác thực thanh toán thất bại: " + (err.response?.data?.error || err.message));
              } finally {
                setLoading(false);
              }
            },
            onError: (err: any) => {
              setError("Đã xảy ra lỗi với PayPal. Vui lòng kiểm tra Sandbox hoặc dùng phương thức Nâng cấp ngay.");
            },
          })
          .render("#paypal-button-container");
      } catch (e: any) {
        console.warn("Lỗi render PayPal Buttons:", e);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
      script.async = true;
      script.onload = () => renderPayPalButtons();
      script.onerror = () => {
        setError("Không thể tải PayPal SDK. Bạn có thể sử dụng nút 'Kích hoạt ngay' phía dưới.");
      };
      document.body.appendChild(script);
    } else {
      renderPayPalButtons();
    }
  }, [paymentMethod, user]);

  const handleUpgradeSuccess = (msg: string) => {
    if (!user) return;
    const updatedUser = { ...user, isPremium: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setSuccess(msg);
    setTimeout(() => {
      navigate("/");
    }, 2200);
  };

  // Nâng cấp trực tiếp không cần qua cổng PayPal (Cực tiện cho chấm bài, demo đồ án)
  const handleInstantUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Thử gọi endpoint upgrade_premium chuyên dụng
      const res = await axios.post(`${API_ORIGIN}/api/users/${user.id}/upgrade-premium/`, {});
      if (res.data?.isPremium) {
        handleUpgradeSuccess("Kích hoạt Spotify Premium thành công! Đang chuyển bạn về trang chủ...");
        return;
      }
    } catch (err) {
      // 2. Fallback sang PATCH user
      try {
        const patchRes = await axios.patch(`${API_ORIGIN}/api/users/${user.id}/`, {
          isPremium: true,
        });
        if (patchRes.data) {
          handleUpgradeSuccess("Nâng cấp Premium thành công! Hãy tận hưởng kho nhạc không giới hạn.");
          return;
        }
      } catch (patchErr: any) {
        setError(patchErr.response?.data?.error || "Không thể nâng cấp tài khoản lúc này. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32">
      {/* Top Banner / Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1e3a25] via-[#152319] to-[#121212] py-14 px-4 text-center border-b border-[#282828]">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
            <Crown size={14} className="text-yellow-400" />
            Spotify Premium VIP
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Âm nhạc không giới hạn. <br />
            <span className="bg-gradient-to-r from-[#1DB954] via-emerald-400 to-[#1ed760] bg-clip-text text-transparent">
              Chất lượng đỉnh cao.
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            Mở khóa toàn bộ album Tam Thái Tử của Jack - J97, các bản hit độc quyền của Sơn Tùng M-TP, HIEUTHUHAI cùng trợ lý Spotify AI DJ thông minh.
          </p>

          {/* Trạng thái hiện tại của tài khoản */}
          {user.isPremium ? (
            <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-sm font-semibold">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Tài khoản của bạn đã kích hoạt gói <strong>Spotify Premium VIP</strong>!</span>
            </div>
          ) : (
            <div className="mt-6 text-xs text-gray-400">
              Tài khoản hiện tại: <span className="text-white font-medium">{user.username}</span> ({user.email}) — <span className="text-amber-400 font-semibold">Gói Miễn Phí (Free)</span>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo Thành công / Thất bại */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 flex items-center gap-3 text-sm animate-fade-in">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-white">Thành công!</p>
              <p>{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 flex items-center gap-3 text-sm animate-fade-in">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-white">Có lỗi xảy ra:</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách các gói Premium */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <h2 className="text-xl md:text-2xl font-black text-white text-center mb-8">
          Chọn gói Premium phù hợp với bạn
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1f2a21] border-2 border-[#1DB954] shadow-2xl shadow-green-950/50 scale-[1.02]"
                    : "bg-[#181818] border border-[#2e2e2e] hover:border-gray-500 hover:bg-[#1e1e1e]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#1DB954] text-black shadow">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-[#1DB954] bg-[#1DB954] text-black"
                          : "border-gray-600"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl md:text-3xl font-black text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>

                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    {plan.desc}
                  </p>

                  <div className="space-y-2.5 border-t border-[#2d2d2d] pt-4 mb-6">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <Check size={15} className="text-[#1DB954] flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "bg-[#1DB954] text-black hover:bg-[#1ed760]"
                      : "bg-[#282828] text-white hover:bg-[#333]"
                  }`}
                >
                  <span>{isSelected ? "Đã chọn gói này" : "Chọn gói này"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Khu vực Thanh toán & Nâng cấp */}
      {!user.isPremium && (
        <div className="max-w-2xl mx-auto px-4 mt-12">
          <div className="bg-[#181818] border border-[#2e2e2e] rounded-2xl p-6 md:p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard size={18} className="text-[#1DB954]" />
              <span>Phương thức nâng cấp</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Bạn có thể chọn kích hoạt ngay để dùng thử hoặc thanh toán bằng cổng PayPal.
            </p>

            {/* Tab chọn hình thức */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-1 bg-[#222] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod("instant")}
                className={`py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  paymentMethod === "instant"
                    ? "bg-[#1DB954] text-black shadow"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Zap size={14} />
                <span>Nâng cấp ngay (Demo / Sinh viên)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  paymentMethod === "paypal"
                    ? "bg-[#1DB954] text-black shadow"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <CreditCard size={14} />
                <span>Thanh toán PayPal SDK</span>
              </button>
            </div>

            {/* Chi tiết theo phương thức */}
            {paymentMethod === "instant" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#222] border border-[#333] text-xs text-gray-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck size={16} />
                    <span>Kích hoạt tức thì — Không cần thẻ tín dụng</span>
                  </div>
                  <p>
                    Thích hợp cho sinh viên, giảng viên hoặc giám khảo kiểm tra toàn bộ tính năng nghe nhạc bản quyền, xem MV, Spotify AI DJ và phát không giới hạn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstantUpgrade}
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#1DB954] text-black font-extrabold text-sm hover:bg-[#1ed760] hover:scale-[1.01] active:scale-[0.99] transition shadow-lg shadow-green-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Đang kích hoạt gói Premium...</span>
                  ) : (
                    <>
                      <Crown size={16} />
                      <span>Kích hoạt Spotify Premium ngay lập tức</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#222] border border-[#333] text-xs text-gray-300 mb-4">
                  <p className="mb-1 font-semibold text-white">Thanh toán bảo mật qua PayPal Sandbox / Live:</p>
                  <p>Số tiền thanh toán: <strong>$2.99 USD</strong> (~59.000₫). Bạn có thể dùng tài khoản cá nhân hoặc thẻ quốc tế (Visa/Mastercard).</p>
                </div>

                <div id="paypal-button-container" className="min-h-[120px] flex items-center justify-center">
                  <span className="text-xs text-gray-500">Đang chuẩn bị nút PayPal...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bảng so sánh tính năng Free vs Premium */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <h3 className="text-xl font-bold text-white text-center mb-6">
          So sánh quyền lợi giữa các gói
        </h3>

        <div className="bg-[#181818] border border-[#282828] rounded-2xl overflow-x-auto shadow-lg">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-[#282828] bg-[#222]">
                <th className="p-4 text-gray-300 font-bold">Tính năng</th>
                <th className="p-4 text-gray-400 font-semibold text-center w-28 md:w-36">Miễn phí</th>
                <th className="p-4 text-[#1DB954] font-bold text-center w-32 md:w-44 bg-[#1b2b1e]">
                  Premium VIP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282828] text-gray-300">
              <tr>
                <td className="p-4">Nghe toàn bộ bài hát bản quyền & Album Tam Thái Tử (Jack - J97)</td>
                <td className="p-4 text-center text-red-400">
                  <X size={16} className="mx-auto" />
                </td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  <Check size={18} className="mx-auto text-[#1DB954]" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Chất lượng âm thanh</td>
                <td className="p-4 text-center text-gray-400">128 kbps</td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  320 kbps (Lossless)
                </td>
              </tr>
              <tr>
                <td className="p-4">Xem MV trực tiếp chuẩn Full HD (YouTube Dock)</td>
                <td className="p-4 text-center text-gray-400">Có</td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  <Check size={18} className="mx-auto text-[#1DB954]" />
                </td>
              </tr>
              <tr>
                <td className="p-4">Trợ lý Spotify AI DJ (Tự động mở nhạc theo khẩu lệnh)</td>
                <td className="p-4 text-center text-gray-400">Giới hạn</td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  Không giới hạn
                </td>
              </tr>
              <tr>
                <td className="p-4">Chuyển bài hát (Skip tracks)</td>
                <td className="p-4 text-center text-gray-400">6 lần / giờ</td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  Vô hạn
                </td>
              </tr>
              <tr>
                <td className="p-4">Hẹn giờ tắt nhạc (Sleep Timer) & Xem lời bài hát</td>
                <td className="p-4 text-center text-[#1DB954]">
                  <Check size={16} className="mx-auto" />
                </td>
                <td className="p-4 text-center text-[#1DB954] bg-[#17241a] font-bold">
                  <Check size={18} className="mx-auto text-[#1DB954]" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PremiumSignup;