import { useState, useEffect } from 'react';
import { Users, Mail, Briefcase, Calendar, Search, Filter } from 'lucide-react';
import api from '../services/api';

const TeamMembers = () => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, projectsRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/projects')
            ]);
            setUsers(usersRes.data);
            setProjects(projectsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch data', error);
            // Use mock data if API fails
            setUsers([
                { id: '1', fullName: 'John Doe', email: 'john@pms.com', role: 'MANAGER', createdAt: '2026-01-15' },
                { id: '2', fullName: 'Jane Smith', email: 'jane@pms.com', role: 'EMPLOYEE', createdAt: '2026-01-20' },
                { id: '3', fullName: 'Mike Johnson', email: 'mike@pms.com', role: 'EMPLOYEE', createdAt: '2026-01-22' },
                { id: '4', fullName: 'Sarah Williams', email: 'sarah@pms.com', role: 'ADMIN', createdAt: '2026-01-10' },
            ]);
            setProjects([
                { id: '1', name: 'Website Redesign', managerId: '1', status: 'IN_PROGRESS' },
                { id: '2', name: 'Mobile App', managerId: '1', status: 'IN_PROGRESS' },
            ]);
            setLoading(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'MANAGER': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'EMPLOYEE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CUSTOMER': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getUserProjects = (userId) => {
        return projects.filter(p => p.managerId === userId);
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleStats = {
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
        MANAGER: users.filter(u => u.role === 'MANAGER').length,
        EMPLOYEE: users.filter(u => u.role === 'EMPLOYEE').length,
        CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Team Members</h1>
                    <p className="text-gray-500 text-lg">View all team members and their project assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium">Total: {users.length} members</span>
                </div>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Admins</p>
                            <p className="text-2xl font-bold text-gray-900">{roleStats.ADMIN}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Managers</p>
                            <p className="text-2xl font-bold text-gray-900">{roleStats.MANAGER}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Employees</p>
                            <p className="text-2xl font-bold text-gray-900">{roleStats.EMPLOYEE}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{roleStats.CUSTOMER}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        className="input-field pl-10 bg-gray-50 border-transparent focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-secondary">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                    const userProjects = getUserProjects(user.id);
                    return (
                        <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                        {user.fullName.charAt(0)}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)} bg-white`}>
                                        {user.role}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-1">{user.fullName}</h3>
                                <div className="flex items-center gap-2 text-indigo-100 text-sm">
                                    <Mail size={14} />
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-bold text-gray-700">Assigned Projects</h4>
                                        <span className="text-xs font-bold text-primary">{userProjects.length}</span>
                                    </div>
                                    {userProjects.length > 0 ? (
                                        <div className="space-y-2">
                                            {userProjects.slice(0, 3).map((project) => (
                                                <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900 truncate flex-1">{project.name}</span>
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                            project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {project.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))}
                                            {userProjects.length > 3 && (
                                                <p className="text-xs text-gray-500 text-center pt-1">
                                                    +{userProjects.length - 3} more projects
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-400">No projects assigned</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className="text-primary font-semibold hover:text-indigo-700">View Profile</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
};

export default TeamMembers;
