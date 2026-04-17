import { useNavigate, NavLink } from "react-router-dom";
import { BarChart2, Music, Users, Mic, LogOut, Disc3} from "lucide-react";

type Props = {
    onLogout: () => void;
};

const SidebarAdmin = ({ onLogout }: Props) => {
    const navigate = useNavigate(); // 👈 thêm dòng này

    const handleLogout = () => {
        onLogout();
        navigate("/login/admin");
    };

    const menuItems = [
        { label: "Thống kê", icon: BarChart2, path: "/admin" },
        { label: "Quản lý bài hát", icon: Music, path: "/admin/songs" },
        { label: "Quản lý user", icon: Users, path: "/admin/users" },
        { label: "Quản lý artist", icon: Mic, path: "/admin/artists" },
        { label: "Quản lý album", icon: Disc3, path: "/admin/album" },
    ];

    return (
        <div className="w-64 bg-[#181818] p-6 flex flex-col justify-between">
            <div>
                <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
                <nav className="space-y-2">
                    {menuItems.map(({ label, icon: Icon, path }) => (
                        <NavLink
                            key={label}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    isActive
                                        ? "bg-[#282828] text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#282828]"
                                }`
                            }
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-[#282828] rounded-lg transition-colors"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default SidebarAdmin;