import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Ticket, Search, HelpCircle, Clock, User, MapPin, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const FloatingChatbot = () => {

    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('chatbot-position');
        return saved ? JSON.parse(saved) : { x: window.innerWidth - 80, y: window.innerHeight - 80 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hi! How can I help you today?', sender: 'bot', type: 'options' }
    ]);
    const [inputText, setInputText] = useState('');
    const [mode, setMode] = useState('OPTIONS'); // OPTIONS, AWAITING_ID, SHOWING_LIST
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Persist position
    useEffect(() => {
        localStorage.setItem('chatbot-position', JSON.stringify(position));
    }, [position]);

    const handlePointerDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        setHasDragged(false);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const boundedX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 60));
        const boundedY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 60));
        setPosition({ x: boundedX, y: boundedY });
        setHasDragged(true);
    };

    const handlePointerUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging]);

    const addMessage = (text, sender = 'bot', type = 'text', data = null) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender, type, data }]);
    };

    const handleOptionClick = async (option) => {
        addMessage(option, 'user');

        if (option === '🔍 Check My Ticket Status') {
            setMode('TICKET_LOOKUP');
            setTimeout(() => {
                addMessage('How would you like to check?', 'bot', 'status-choice');
            }, 500);
        } else if (option === '🎫 Raise a New Ticket') {
            setTimeout(() => {
                addMessage('Ticket raising via the dashboard has been disabled. Please contact IT directly or use this assistant to track existing ones.', 'bot');
            }, 500);

        } else if (option === '❓ Get Help / FAQs') {
            setTimeout(() => {
                addMessage('I can help you track tickets or guide you through the PMS. What do you need help with?', 'bot');
            }, 500);
        }
    };

    const handleStatusChoice = async (choice) => {
        if (choice === 'ID') {
            setMode('AWAITING_ID');
            addMessage('Please enter your Ticket ID:', 'bot');
        } else {
            addMessage('Fetching your recent tickets...', 'bot');
            try {
                const res = await api.get('tickets/recent');
                if (res.data.length === 0) {
                    addMessage('You haven\'t raised any tickets yet.', 'bot');
                } else {
                    addMessage('Here are your 5 most recent tickets:', 'bot', 'ticket-list', res.data);
                }
            } catch (err) {
                addMessage('❌ Unable to fetch tickets. Please try again later.', 'bot');
            }
        }
    };

    const fetchTicketDetails = async (id) => {
        addMessage(`Checking status for ${id}...`, 'bot');
        try {
            const res = await api.get(`tickets/${id}/status`);
            addMessage('Found it! Here are the details:', 'bot', 'ticket-detail', res.data);
        } catch (err) {
            const msg = err.response?.status === 403
                ? '🔒 You don’t have permission to view this ticket.'
                : '❌ Ticket not found. Please check the Ticket ID.';
            addMessage(msg, 'bot');
        }
        setMode('OPTIONS');
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');
        addMessage(text, 'user');

        if (mode === 'AWAITING_ID') {
            fetchTicketDetails(text);
        } else {
            setTimeout(() => {
                addMessage('I\'m an AI assistant. Please use the quick actions for specific tasks like checking ticket status.', 'bot');
            }, 500);
        }
    };

    const resetChat = () => {
        setMessages([{ id: 1, text: 'Hi! How can I help you today?', sender: 'bot', type: 'options' }]);
        setMode('OPTIONS');
    };

    return (
        <>
            {/* Icon */}
            <div
                onPointerDown={handlePointerDown}
                onClick={() => !hasDragged && setIsOpen(!isOpen)}
                style={{ left: `${position.x}px`, top: `${position.y}px`, zIndex: 9999, position: 'fixed', touchAction: 'none' }}
                className={clsx(
                    "w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform active:scale-95 shadow-2xl",
                    isDragging ? "scale-110" : "hover:scale-110"
                )}
            >
                <div className="w-full h-full rounded-full flex items-center justify-center border-2 border-white/20 bg-[#B69D74] text-[#1F2839]">
                    <MessageCircle size={28} strokeWidth={2.5} />
                </div>
            </div>

            {/* Panel */}
            <div className={clsx(
                "fixed bottom-24 right-8 w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl transition-all duration-300 transform origin-bottom-right z-[9998] overflow-hidden border border-gray-100 flex flex-col font-sans",
                isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
            )}>
                <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-[#1F2839] text-[#B69D74]">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1F2839]"></div>
                        </div>
                        <div>
                            <span className="font-black text-sm block leading-none">PMS Assistant</span>
                            <span className="text-[10px] font-bold opacity-70">Always Online</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={resetChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Reset Chat">
                            <ArrowLeft size={18} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                    {messages.map((m) => (
                        <div key={m.id} className={clsx("flex flex-col", m.sender === 'user' ? "items-end" : "items-start")}>
                            <div className={clsx(
                                "max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm",
                                m.sender === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                            )}>
                                {m.text}

                                {m.type === 'options' && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        {['🎫 Raise a New Ticket', '🔍 Check My Ticket Status', '❓ Get Help / FAQs'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleOptionClick(opt)}
                                                className="w-full p-3 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl text-left font-bold transition-all border border-gray-100 text-[11px] flex items-center gap-2"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {m.type === 'status-choice' && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <button onClick={() => handleStatusChoice('ID')} className="w-full p-3 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl text-left font-bold transition-all border border-gray-100 flex items-center gap-2">
                                            <Search size={14} /> Enter Ticket ID
                                        </button>
                                        <button onClick={() => handleStatusChoice('RECENT')} className="w-full p-3 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl text-left font-bold transition-all border border-gray-100 flex items-center gap-2">
                                            <Clock size={14} /> Show my recent tickets
                                        </button>
                                    </div>
                                )}

                                {m.type === 'ticket-list' && (
                                    <div className="mt-4 space-y-2">
                                        {m.data.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => fetchTicketDetails(t.id)}
                                                className="w-full p-3 bg-gray-50 hover:bg-white border hover:border-primary rounded-xl text-left transition-all"
                                            >
                                                <p className="text-[10px] font-black text-primary">#{t.id.slice(0, 8)}</p>
                                                <p className="text-[11px] font-bold text-gray-900 truncate">{t.title}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[9px] text-gray-500 uppercase">{t.campus}</span>
                                                    <span className={clsx(
                                                        "text-[8px] px-1.5 py-0.5 rounded font-black",
                                                        t.status === 'CLOSED' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                    )}>{t.status}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {m.type === 'ticket-detail' && (
                                    <div className="mt-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-xl space-y-4 text-[11px]">
                                        <div className="flex items-center gap-2 text-primary font-black border-b border-gray-50 pb-3 mb-2">
                                            <span className="text-sm">🎫</span>
                                            <span className="uppercase tracking-tighter">Ticket ID: TCK-{m.data.id.slice(0, 8).toUpperCase()}</span>
                                        </div>

                                        <div className="space-y-3 font-medium">
                                            <div className="flex items-start gap-3">
                                                <span className="text-base">🏫</span>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Campus</p>
                                                    <p className="text-gray-900">{m.data.campus || 'General / IT'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <span className="text-base">📌</span>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Status</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={clsx(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            m.data.status === 'CLOSED' ? "bg-green-500" :
                                                                m.data.status === 'IN_PROGRESS' || m.data.status === 'OPEN' ? "bg-yellow-500" : "bg-red-500"
                                                        )}></span>
                                                        <span className="text-gray-900 capitalize font-bold">{m.data.status.toLowerCase().replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <span className="text-base">👨‍💻</span>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Assigned To</p>
                                                    <p className="text-gray-900 font-bold">{m.data.assignee?.fullName || 'Not Assigned'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <span className="text-base">⏳</span>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">SLA Status</p>
                                                    <p className={clsx(
                                                        "font-black uppercase tracking-tight",
                                                        new Date(m.data.slaDeadline) < new Date() ? "text-red-500" : "text-green-600"
                                                    )}>
                                                        {new Date(m.data.slaDeadline) < new Date() ? '🔴 Overdue' : '🟢 On Track'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-bold italic">
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                Last updated {formatDistanceToNow(new Date(m.data.updatedAt))} ago
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={mode === 'AWAITING_ID' ? 'Enter Ticket ID...' : 'Type a message...'}
                        className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#B69D74] outline-none font-medium"
                    />
                    <button type="submit" className="p-3 bg-[#B69D74] text-[#1F2839] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#B69D74]/20">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </>
    );
};

export default FloatingChatbot;


