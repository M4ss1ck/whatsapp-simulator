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
    type: 'text' | 'audio' | 'image';
    audioDuration?: string; // Format: MM:SS
    imageUrl?: string; // URL of the image
    imageCaption?: string; // Optional caption for images
    replyToId?: string; // ID of the message being replied to
    replyToPreview?: string; // Preview text of the replied message (useful for deleted messages)
    replyToType?: 'text' | 'audio' | 'image'; // Type of the message being replied to
}

export type MessageJson = Omit<Message, 'timestamp'> & {
    timestamp: string;
};

export interface ChatSettings {
    mode: 'private' | 'group';
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

export interface ExportedChatData {
    participants: Participant[];
    messages: MessageJson[];
    chatSettings: ChatSettings;
    meId: string | null;
    phoneStatus: PhoneStatusBar;
    showDateDividers?: boolean;
    chatBackground?: string;
    conversationTitle?: string;
}
