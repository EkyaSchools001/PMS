import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, FolderKanban, CheckCircle2, ArrowUpRight, Clock } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: 'Active Projects', value: '12', icon: FolderKanban, color: 'bg-blue-500', change: '+12%' },
        { label: 'Total Tasks', value: '48', icon: CheckCircle2, color: 'bg-emerald-500', change: '+8%' },
        { label: 'Team Members', value: '24', icon: Users, color: 'bg-purple-500', change: '+3%' },
        { label: 'Hours Logged', value: '156', icon: Clock, color: 'bg-amber-500', change: '+15%' },
    ];

    const recentProjects = [
        { name: 'Website Redesign', status: 'In Progress', progress: 75, color: 'bg-blue-500' },
        { name: 'Mobile App', status: 'In Review', progress: 90, color: 'bg-purple-500' },
        { name: 'Marketing Campaign', status: 'Planning', progress: 30, color: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/20">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
                        <p className="text-indigo-100 text-lg">Here's what's happening with your projects today.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-sm text-indigo-100">Role</p>
                        <p className="font-bold text-lg capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-${stat.color}/30 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} />
                                </div>
                                <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                        <button className="text-primary text-sm font-semibold hover:text-indigo-700 flex items-center gap-1">
                            View All <ArrowUpRight size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentProjects.map((project, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                    <span className="text-xs font-medium text-gray-500">{project.status}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`${project.color} h-2 rounded-full transition-all duration-500`}
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{project.progress}% Complete</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full btn btn-primary justify-start text-left py-4">
                            <FolderKanban size={20} />
                            Create New Project
                        </button>
                        <button className="w-full btn btn-secondary justify-start text-left py-4">
                            <CheckCircle2 size={20} />
                            Add Task
                        </button>
                        <button className="w-full btn btn-secondary justify-start text-left py-4">
                            <Users size={20} />
                            Invite Team Member
                        </button>
                        <button className="w-full btn btn-secondary justify-start text-left py-4">
                            <Clock size={20} />
                            Log Time
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                    {[
                        { action: 'New task assigned', project: 'Website Redesign', time: '2 hours ago', color: 'bg-blue-500' },
                        { action: 'Project milestone completed', project: 'Mobile App', time: '5 hours ago', color: 'bg-emerald-500' },
                        { action: 'Team member joined', project: 'Marketing Campaign', time: '1 day ago', color: 'bg-purple-500' },
                    ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className={`${activity.color} w-2 h-2 rounded-full mt-2 shrink-0`}></div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.action}</p>
                                <p className="text-sm text-gray-500">{activity.project}</p>
                            </div>
                            <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
