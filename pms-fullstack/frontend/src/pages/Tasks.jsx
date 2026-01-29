import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const Tasks = () => {
    const tasks = [
        { id: 1, title: 'Design Homepage', project: 'Website Redesign', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2026-02-05' },
        { id: 2, title: 'Setup React App', project: 'Website Redesign', priority: 'MEDIUM', status: 'DONE', dueDate: '2026-01-28' },
        { id: 3, title: 'Create API Endpoints', project: 'Mobile App', priority: 'HIGH', status: 'TODO', dueDate: '2026-02-10' },
    ];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-50 text-red-600 border-red-100';
            case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'LOW': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DONE': return 'bg-emerald-100 text-emerald-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'TODO': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">My Tasks</h1>
                    <p className="text-gray-500 text-lg">Track and manage your assigned tasks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900">1</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">1</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">1</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">All Tasks</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {tasks.map((task) => (
                        <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                                    <p className="text-sm text-gray-500">{task.project}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <span className="text-gray-500 flex items-center gap-1">
                                    <Clock size={14} />
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tasks;
