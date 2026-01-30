import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, User, CheckCircle, Clock, MoreHorizontal, AlertCircle, ArrowUpRight } from 'lucide-react';

const ProjectDetails = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeIds: []
    });
    const [showChat, setShowChat] = useState(false);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const { data } = await api.get(`projects/${id}`);
            setProject(data);
            setMembers(data.members || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch project details', error);
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('tasks', { ...newTask, projectId: id });
            setShowTaskModal(false);
            fetchProjectDetails();
            setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [] });
        } catch (error) {
            alert('Failed to create task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`tasks/${taskId}/status`, { status: newStatus });
            fetchProjectDetails();
        } catch (error) {
            alert('Failed to update task status');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
        </div>
    );

    if (!project) return <div className="text-center py-20 text-gray-500">Project not found</div>;

    const tasksByStatus = {
        TODO: project.tasks.filter(t => t.status === 'TODO'),
        IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS'),
        IN_REVIEW: project.tasks.filter(t => t.status === 'IN_REVIEW'),
        DONE: project.tasks.filter(t => t.status === 'DONE'),
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-50 text-red-600 border-red-100';
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200 font-bold ring-1 ring-red-500/20';
            case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'LOW': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Project Header */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{project.name}</h1>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100">
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">{project.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {project.chat && (
                            <button
                                onClick={() => navigate(`/chat?chatId=${project.chat.id}`)}
                                className="btn bg-green-500 text-white hover:bg-green-600 shrink-0 shadow-lg"
                            >
                                Open Group Chat
                            </button>
                        )}
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="btn btn-primary shrink-0 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                            >
                                <Plus size={20} />
                                Add New Task
                            </button>
                        )}
                    </div>
                </div>

                {/* Team Members Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4">Team Members</h3>
                    <div className="flex flex-wrap gap-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    {member.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{member.fullName}</p>
                                    <p className="text-xs text-gray-500">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Project Manager</p>
                            <p className="font-semibold text-gray-900">{project.manager.fullName}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-500">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Due Date</p>
                            <p className="font-semibold text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Budget</p>
                            <p className="font-semibold text-gray-900">${project.budget.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4 items-start">
                {Object.entries(tasksByStatus).map(([status, tasks]) => (
                    <div key={status} className="flex flex-col h-full min-w-[280px]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2.5">
                                <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${status === 'TODO' ? 'bg-gray-400' :
                                    status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                        status === 'IN_REVIEW' ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                    }`}></span>
                                {status.replace('_', ' ')}
                            </h3>
                            <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                {tasks.length}
                            </span>
                        </div>

                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/80 flex-1 min-h-[500px] space-y-3">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 hover:border-primary/20 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-100 group-hover:bg-primary transition-colors"></div>

                                    <div className="flex justify-between items-start mb-3 pl-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border ${getPriorityStyle(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-50 rounded">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    <h4 className="font-bold text-gray-900 mb-2 leading-snug pl-2 group-hover:text-primary transition-colors">{task.title}</h4>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 pl-2 leading-relaxed">{task.description}</p>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 pl-2">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                            <Clock size={14} />
                                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                                        </div>

                                        <div className="relative group/select">
                                            <select
                                                className="text-[10px] font-bold uppercase tracking-wide bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-2 text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer hover:bg-white hover:shadow-sm transition-all appearance-none pr-6"
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="TODO">Todo</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="IN_REVIEW">Review</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                            <ArrowUpRight size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-3">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">No tasks yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            {
                showTaskModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Add Task</h2>
                                    <p className="text-sm text-gray-500">Create a new action item</p>
                                </div>
                                <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                    <span className="text-2xl leading-none">&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Task Title</label>
                                        <input
                                            required
                                            className="input-field bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="What needs to be done?"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Description</label>
                                        <textarea
                                            className="input-field min-h-[100px] bg-gray-50 focus:bg-white transition-colors resize-none"
                                            placeholder="Add context and details..."
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Priority</label>
                                            <div className="relative">
                                                <AlertCircle className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <select
                                                    className="input-field pl-10 appearance-none bg-gray-50 focus:bg-white"
                                                    value={newTask.priority}
                                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                                >
                                                    <option value="LOW">Low</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HIGH">High</option>
                                                    <option value="CRITICAL">Critical</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Due Date</label>
                                            <input
                                                type="date"
                                                className="input-field bg-gray-50 focus:bg-white"
                                                value={newTask.dueDate}
                                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Assignees</label>
                                        <select
                                            multiple
                                            className="input-field bg-gray-50 focus:bg-white h-24"
                                            value={newTask.assigneeIds}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                setNewTask({ ...newTask, assigneeIds: selected });
                                            }}
                                        >
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.fullName}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskModal(false)}
                                        className="flex-1 btn btn-secondary py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn btn-primary py-3 shadow-lg shadow-primary/25 hover:shadow-primary/40">
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetails;
