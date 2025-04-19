import { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Participant, WhatsAppState, PhoneStatusBar, ChatSettings } from '../types';

interface ChatContextType {
    state: WhatsAppState;
    addParticipant: (newParticipant: Omit<Participant, 'id'>) => void;
    removeParticipant: (id: string) => void;
    updateParticipant: (participant: Participant) => void;
    setAsMe: (id: string) => void;
    sendMessage: (message: Omit<Message, 'id'>) => void;
    updateChatSettings: (settings: Partial<ChatSettings>) => void;
    updatePhoneStatus: (status: Partial<PhoneStatusBar>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<WhatsAppState>({
        participants: [],
        messages: [],
        chatSettings: {
            mode: 'group',
            title: 'Group Chat',
            avatar: null
        },
        meId: null,
        phoneStatus: {
            batteryLevel: 100,
            customTime: null
        }
    });

    const addParticipant = (newParticipant: Omit<Participant, 'id'>) => {
        const participant = {
            ...newParticipant,
            id: uuidv4()
        };

        setState(prev => ({
            ...prev,
            participants: [...prev.participants, participant]
        }));

        return participant;
    };

    const removeParticipant = (id: string) => {
        setState(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== id),
            meId: prev.meId === id ? null : prev.meId
        }));
    };

    const updateParticipant = (participant: Participant) => {
        setState(prev => ({
            ...prev,
            participants: prev.participants.map(p =>
                p.id === participant.id ? participant : p
            )
        }));
    };

    const setAsMe = (id: string) => {
        setState(prev => ({
            ...prev,
            meId: id,
            chatSettings: {
                ...prev.chatSettings,
                mode: prev.participants.length === 2 ? 'private' : prev.chatSettings.mode
            }
        }));
    };

    const sendMessage = (messageData: Omit<Message, 'id'>) => {
        const message = {
            ...messageData,
            id: uuidv4()
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, message]
        }));
    };

    const updateChatSettings = (settings: Partial<ChatSettings>) => {
        setState(prev => ({
            ...prev,
            chatSettings: {
                ...prev.chatSettings,
                ...settings
            }
        }));
    };

    const updatePhoneStatus = (status: Partial<PhoneStatusBar>) => {
        setState(prev => ({
            ...prev,
            phoneStatus: {
                ...prev.phoneStatus,
                ...status
            }
        }));
    };

    const value = {
        state,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setAsMe,
        sendMessage,
        updateChatSettings,
        updatePhoneStatus
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
} 