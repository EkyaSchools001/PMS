import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Settings, PieChart, Users, MessageSquare, Calendar } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const allNavItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'] },
        { label: 'Projects', path: '/projects', icon: FolderKanban, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'] },
        { label: 'Team Members', path: '/team', icon: Users, roles: ['ADMIN', 'MANAGER'] },
        { label: 'Chat', path: '/chat', icon: MessageSquare, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'] },
        { label: 'Calendar', path: '/calendar', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'] },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'] },
        { label: 'Reports', path: '/reports', icon: PieChart, roles: ['ADMIN', 'MANAGER'] },
    ];

    // Filter nav items based on user role
    const navItems = allNavItems.filter(item =>
        !item.roles || item.roles.includes(user?.role)
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-72 bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-100 shadow-xl shadow-gray-200/50 z-50">
            {/* Logo Area */}
            <div className="p-8 pb-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                        <LayoutDashboard size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">PMS Pro</h1>
                        <p className="text-xs text-gray-400 font-medium tracking-wide">WORKSPACE</p>
                    </div>
                </div>

                {/* User Profile Card */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2 group cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-sm font-bold text-primary relative">
                            {user?.fullName?.charAt(0) || 'U'}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="font-semibold text-sm truncate text-gray-900">{user?.fullName}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-2">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                            )}
                        >
                            <Icon size={20} className={clsx("transition-colors relative z-10", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                            <span className="relative z-10">{item.label}</span>
                            {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 m-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-500">Storage Used</p>
                    <p className="text-xs font-bold text-primary">75%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full w-3/4"></div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all text-sm font-medium shadow-sm"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
