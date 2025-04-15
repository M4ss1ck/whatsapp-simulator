import { useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Message, Participant, PhoneStatusBar } from '../types';
import { ChatMode } from './ChatSettings';
import { Battery100Icon } from '@heroicons/react/24/solid';

interface ChatPreviewProps {
    messages: Message[];
    participants: Participant[];
    mode: ChatMode;
    meId: string | null;
    groupTitle?: string;
    groupAvatar?: string | null;
    phoneStatus: PhoneStatusBar;
}

export default function ChatPreview({
    messages,
    participants,
    mode,
    meId,
    groupTitle = 'Group Chat',
    groupAvatar = null,
    phoneStatus
}: ChatPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const phoneRef = useRef<HTMLDivElement>(null);

    const getParticipantById = (id: string): Participant | undefined => {
        return participants.find(p => p.id === id);
    };

    const formatTime = (date: Date): string => {
        if (phoneStatus.customTime && phoneStatus.customTime.trim() !== '') {
            return phoneStatus.customTime;
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getCurrentTime = (): string => {
        if (phoneStatus.customTime && phoneStatus.customTime.trim() !== '') {
            return phoneStatus.customTime;
        }
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const exportAsImage = async () => {
        if (!phoneRef.current) return;

        try {
            const dataUrl = await toPng(phoneRef.current);
            const link = document.createElement('a');
            link.download = `whatsapp-chat-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
        }
    };

    // Group messages by date
    const messagesByDate = messages.reduce<Record<string, Message[]>>((groups, message) => {
        const dateStr = message.timestamp.toDateString();
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(message);
        return groups;
    }, {});

    // Get other participant for private chat header
    const otherParticipant = mode === 'private' && meId
        ? participants.find(p => p.id !== meId)
        : null;

    // Prepare header information
    const chatTitle = mode === 'private' && otherParticipant
        ? otherParticipant.name
        : groupTitle;

    const chatAvatar = mode === 'private' && otherParticipant
        ? otherParticipant.avatar
        : groupAvatar;

    // Generate participants list for group chat
    const participantsList = mode === 'group'
        ? participants.map(p => p.name).join(', ')
        : '';

    // Function to determine if a message should show the sender's avatar
    // Only show avatar for the first message in a sequence from the same sender
    const shouldShowAvatar = (messages: Message[], index: number): boolean => {
        if (index === 0) return true;
        return messages[index].senderId !== messages[index - 1].senderId;
    };

    // Function to determine if a message should show the tail (arrow)
    const shouldShowTail = (messages: Message[], index: number): boolean => {
        return shouldShowAvatar(messages, index);
    };

    // Function to determine if a message is part of a sequence
    const isSequentialMessage = (messages: Message[], index: number): boolean => {
        if (index === 0) return false;
        return messages[index].senderId === messages[index - 1].senderId;
    };

    useEffect(() => {
        // Update favicon and title based on chat
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (favicon) {
            if (chatAvatar) {
                favicon.href = chatAvatar;
            } else {
                // Default favicon
                favicon.href = '/favicon.ico';
            }
        }

        // Update page title
        document.title = chatTitle || 'WhatsApp Simulator';
    }, [groupTitle, groupAvatar, mode, participants, meId, chatTitle, chatAvatar]);

    return (
        <div ref={containerRef} className="w-[375px]">
            <div ref={phoneRef} className="bg-[#111b21] rounded-[40px] shadow-2xl overflow-hidden border-8 border-black">
                {/* Phone status bar */}
                <div className="bg-black text-white h-7 flex items-center justify-between px-5 text-xs">
                    <div>{getCurrentTime()}</div>
                    <div className="flex items-center">
                        <span className="mr-1 text-xs">{phoneStatus.batteryLevel}%</span>
                        <Battery100Icon className="h-4 w-4" />
                    </div>
                </div>

                {/* WhatsApp header */}
                <div className="bg-[#008069] text-white p-3 flex items-center">
                    {chatAvatar ? (
                        <img
                            src={chatAvatar}
                            alt={chatTitle || ''}
                            className="h-10 w-10 rounded-full mr-3 object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="h-10 w-10 bg-[#00a884] rounded-full mr-3 flex items-center justify-center text-lg font-semibold">
                            {chatTitle ? chatTitle.charAt(0).toUpperCase() : '?'}
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-semibold">{chatTitle}</h2>
                        {mode === 'group' && participantsList && (
                            <p className="text-xs text-gray-200">{participantsList}</p>
                        )}
                    </div>
                </div>

                {/* Chat container */}
                <div
                    className="bg-[#efeae2] p-3 h-[500px] overflow-y-auto"
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 2000' width='300' height='300'%3E%3Cdefs%3E%3Cpattern id='pattern' patternUnits='userSpaceOnUse' width='300' height='300' patternTransform='scale(7) rotate(0)'%3E%3Cpath d='M150 0L75 200L225 200Z' fill='rgba(0, 0, 0, 0.03)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23efeae2'/%3E%3Crect width='100%25' height='100%25' fill='url(%23pattern)'/%3E%3C/svg%3E\")",
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No messages yet
                        </div>
                    ) : (
                        Object.entries(messagesByDate).map(([dateStr, dateMessages]) => (
                            <div key={dateStr}>
                                <div className="flex justify-center my-3">
                                    <div className="bg-[#ffffff] px-3 py-1 rounded-lg text-xs text-gray-600 shadow-sm">
                                        {formatDate(new Date(dateStr))}
                                    </div>
                                </div>

                                {dateMessages.map((message, index) => {
                                    const sender = getParticipantById(message.senderId);
                                    const isMe = sender?.id === meId;
                                    const showName = mode === 'group' && !isMe && shouldShowAvatar(dateMessages, index);
                                    const showTail = shouldShowTail(dateMessages, index);
                                    const isSequential = isSequentialMessage(dateMessages, index);

                                    return (
                                        <div key={message.id} className={`${isSequential ? 'mb-0.5' : isMe ? 'mb-2' : 'mb-3'}`}>
                                            {showName && sender && (
                                                <div className="text-xs text-gray-600 pl-10 mb-0.5">
                                                    {sender.name}
                                                </div>
                                            )}

                                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {/* Create a fixed-width container for avatar to maintain alignment */}
                                                {!isMe && (
                                                    <div className="self-end mr-1 min-w-[36px] w-9 flex justify-center">
                                                        {!isSequential && sender && (
                                                            <>
                                                                {sender.avatar ? (
                                                                    <img
                                                                        src={sender.avatar}
                                                                        alt={sender.name}
                                                                        className="h-8 w-8 rounded-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                                        {sender.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message content */}
                                                <div
                                                    className={`max-w-[70%] p-2 relative
                                                    ${isMe ? 'bg-[#d9fdd3]' : 'bg-white'} 
                                                    ${isSequential ? 'mt-0.5' : 'mt-0'} 
                                                    rounded-lg
                                                    ${!isSequential && isMe ? 'rounded-tr-none' : ''}
                                                    ${!isSequential && !isMe ? 'rounded-tl-none' : ''}
                                                    `}
                                                >
                                                    {/* Message tail - only show for first message in a sequence */}
                                                    {showTail && (
                                                        <div
                                                            className={`absolute top-0 w-3 h-3 ${isMe ? 'right-0 -mr-1 bg-[#d9fdd3]' : 'left-0 -ml-1 bg-white'}`}
                                                            style={{
                                                                transform: isMe ? 'skew(40deg)' : 'skew(-40deg)',
                                                                borderRadius: '2px'
                                                            }}
                                                        />
                                                    )}

                                                    <div className="text-sm">{message.text}</div>

                                                    <div className="text-[10px] text-gray-500 text-right mt-1">
                                                        {formatTime(message.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom input area (visual only) */}
                <div className="bg-[#f0f2f5] p-2 border-t border-gray-300 flex items-center">
                    <div className="w-full h-10 bg-white rounded-full"></div>
                </div>
            </div>

            {/* Export button outside phone UI */}
            <div className="mt-4 flex justify-center">
                <button
                    onClick={exportAsImage}
                    className="bg-[#25d366] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00a884] transition shadow-sm"
                >
                    Export as Image
                </button>
            </div>
        </div>
    );
} 