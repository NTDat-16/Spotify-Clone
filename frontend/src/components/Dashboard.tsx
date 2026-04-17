import { useState, useEffect } from 'react';
import { FaMusic, FaUsers, FaMicrophone } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Artist {
    id: number;
    name: string;
    status: number;
}
export default function Dashboard() {
    const [activeArtists, setActiveArtists] = useState(0);
    // State để lưu dữ liệu và trạng thái loading
    useEffect(() => {
        axios.get("http://localhost:8000/api/artists/")
            .then(res => {
                const data = res.data;
                const active = data.filter((artist:Artist) => artist.status === 1);
                setActiveArtists(active.length);
            })
            .catch(err => {
                console.error("Lỗi khi fetch artists:", err);
            });
    }, []);
    const [stats, setStats] = useState({
        totalSongs: 0,
        totalUsers: 0,
        totalArtists: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userGrowthData, setUserGrowthData] = useState([]); // Dữ liệu cho biểu đồ user mới theo ngày

    // Fetch dữ liệu từ API khi component mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Lấy thống kê tổng quan
                const statsResponse = await axios.get('http://localhost:8000/api/stats/');
                setStats({
                    totalSongs: statsResponse.data.total_songs,
                    totalUsers: statsResponse.data.total_users,
                    totalArtists: statsResponse.data.total_artists,
                });

                // Lấy dữ liệu cho biểu đồ user mới theo ngày
                const userGrowthResponse = await axios.get('http://localhost:8000/api/stats/users-by-date/');
                setUserGrowthData(userGrowthResponse.data); // Ví dụ: [{ date: '2025-04-01', count: 10 }, { date: '2025-04-02', count: 15 }]
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu thống kê:', error);
                toast.error('Không thể tải dữ liệu thống kê. Vui lòng thử lại!');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 bg-[#121212] text-white">
            <h1 className="text-3xl font-bold mb-8 tracking-tight">Thống kê</h1>

            {/* Hiển thị loading spinner nếu đang tải dữ liệu */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
                </div>
            ) : (
                <>
                    {/* Grid thống kê */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <Link
                            to="/admin/songs"
                            className="bg-[#282828] p-6 rounded-lg shadow-lg hover:bg-[#383838] transition duration-300"
                        >
                            <div className="flex items-center space-x-4">
                                <FaMusic className="text-green-500 text-2xl" />
                                <div>
                                    <h3 className="text-lg font-semibold">Tổng bài hát</h3>
                                    <p className="text-3xl mt-2">{stats.totalSongs.toLocaleString()}</p>
                                </div>
                            </div>
                        </Link>
                        <Link
                            to="/admin/users"
                            className="bg-[#282828] p-6 rounded-lg shadow-lg hover:bg-[#383838] transition duration-300"
                        >
                            <div className="flex items-center space-x-4">
                                <FaUsers className="text-green-500 text-2xl" />
                                <div>
                                    <h3 className="text-lg font-semibold">Tổng user</h3>
                                    <p className="text-3xl mt-2">{stats.totalUsers.toLocaleString()}</p>
                                </div>
                            </div>
                        </Link>
                        <Link
                            to="/admin/artists"
                            className="bg-[#282828] p-6 rounded-lg shadow-lg hover:bg-[#383838] transition duration-300"
                        >
                            <div className="flex items-center space-x-4">
                                <FaMicrophone className="text-green-500 text-2xl" />
                                <div>
                                    <h3 className="text-lg font-semibold">Tổng artist</h3>
                                    <p className="text-3xl mt-2">{activeArtists}</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Biểu đồ thống kê user mới theo ngày */}
                    <div className="bg-[#282828] p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">User mới theo ngày</h3>
                        {userGrowthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={userGrowthData}>
                                    <XAxis dataKey="date" stroke="#ffffff" />
                                    <YAxis stroke="#ffffff" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#383838', border: 'none', color: '#ffffff' }}
                                        cursor={{ stroke: '#1db954', strokeWidth: 2 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#1db954"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-400">Không có dữ liệu để hiển thị.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}