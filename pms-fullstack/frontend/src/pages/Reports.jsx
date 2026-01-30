import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import api from '../services/api';

const Reports = () => {
    const [stats, setStats] = useState({
        totalProjects: 0,
        completionRate: 0,
        activeUsers: 0,
        avgDuration: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projectsRes, usersRes] = await Promise.all([
                api.get('projects'),
                api.get('users')
            ]);

            const projects = projectsRes.data;
            const users = usersRes.data;

            // Calculate stats
            const totalProjects = projects.length;
            const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
            const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
            const activeUsers = users.length;

            // Calculate average duration (simplified - using days between start and end dates)
            const projectsWithDates = projects.filter(p => p.startDate && p.endDate);
            const avgDuration = projectsWithDates.length > 0
                ? Math.round(
                    projectsWithDates.reduce((sum, p) => {
                        const start = new Date(p.startDate);
                        const end = new Date(p.endDate);
                        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        return sum + days;
                    }, 0) / projectsWithDates.length
                )
                : 0;

            setStats({
                totalProjects,
                completionRate,
                activeUsers,
                avgDuration
            });
        } catch (error) {
            console.error('Failed to fetch reports', error);
            setError(error.response?.data?.message || 'Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Reports</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchReports}
                        className="btn btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Reports & Analytics</h1>
                <p className="text-gray-500 text-lg">Track project performance and team productivity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Projects</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Avg. Duration</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.avgDuration}d</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed Reports Coming Soon</h3>
                    <p className="text-gray-500">
                        We're working on comprehensive analytics and reporting features. Stay tuned for charts, graphs, and detailed insights.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Reports;
