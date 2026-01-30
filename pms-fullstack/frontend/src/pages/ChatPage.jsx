import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { initiateSocketConnection, disconnectSocket } from '../services/socketService';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchParams] = useSearchParams();
    const initialChatId = searchParams.get('chatId');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            initiateSocketConnection(token);
        }
        return () => {
            disconnectSocket();
        };
    }, []);

    return (
        <div className="flex h-screen bg-white">
            <ChatSidebar
                onSelectChat={setSelectedChat}
                activeChatId={selectedChat?.id}
                initialChatId={initialChatId}
            />
            <ChatWindow chat={selectedChat} />
        </div>
    );
};

export default ChatPage;
