import { ChatMode } from './components/ChatSettings';

export interface Participant {
    id: string;
    name: string;
    avatar: string | null;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface ChatSettings {
    mode: ChatMode;
    title: string;
    avatar: string | null;
}

export interface PhoneStatusBar {
    batteryLevel: number;
    customTime: string | null;
}

export interface WhatsAppState {
    participants: Participant[];
    messages: Message[];
    chatSettings: ChatSettings;
    meId: string | null;
    phoneStatus: PhoneStatusBar;
} 