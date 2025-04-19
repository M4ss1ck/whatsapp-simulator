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
    showDateDividers?: boolean;
    customDateFormat?: (date: Date) => string;
    backgroundImage?: string;
    onMessageClick?: (message: Message) => void;
}

export default function ChatPreview({
    messages,
    participants,
    mode,
    meId,
    groupTitle = 'Group Chat',
    groupAvatar = null,
    phoneStatus,
    showDateDividers = true,
    customDateFormat,
    backgroundImage,
    onMessageClick
}: ChatPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const phoneRef = useRef<HTMLDivElement>(null);

    const getParticipantById = (id: string): Participant | undefined => {
        return participants.find(p => p.id === id);
    };

    // Get the message being replied to
    const getRepliedMessage = (replyToId: string): Message | undefined => {
        return messages.find(m => m.id === replyToId);
    };

    // Get a preview text for a message
    const getMessagePreview = (message: Message): string => {
        switch (message.type) {
            case 'audio':
                return 'Voice message';
            case 'image':
                return message.imageCaption || 'Photo';
            default:
                return message.text.length > 50 ? message.text.substring(0, 47) + '...' : message.text;
        }
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
        if (customDateFormat) {
            return customDateFormat(date);
        }
        return date.toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAudioDuration = (duration: string | undefined): string => {
        if (!duration) return '0:00';

        // Split the duration into hours, minutes, seconds
        const parts = duration.split(':');

        // If it's already in mm:ss format, return as is
        if (parts.length === 2) return duration;

        // If it's in HH:mm:ss format, convert to mm:ss
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parts[2];

            // Calculate total minutes
            const totalMinutes = hours * 60 + minutes;

            return `${totalMinutes}:${seconds}`;
        }

        return '0:00';
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

    // Identify system date messages
    const isSystemDateMessage = (message: Message): boolean => {
        return message.senderId === 'system_date';
    };

    // Filter messages to prevent consecutive system date messages
    const processedMessages = messages.reduce<Message[]>((result, message, index, array) => {
        // If this is a system date message, check if the previous one was also a system message
        if (isSystemDateMessage(message) && index > 0 && isSystemDateMessage(array[index - 1])) {
            // Skip this message (don't add consecutive system messages)
            return result;
        }
        result.push(message);
        return result;
    }, []);

    // Group messages by date, but only if showDateDividers is true and there are no system date messages
    const shouldGroupByDate = showDateDividers && !processedMessages.some(isSystemDateMessage);

    const messagesByDate = shouldGroupByDate
        ? processedMessages.reduce<Record<string, Message[]>>((groups, message) => {
            // Skip grouping for system date messages (they create their own groups)
            if (isSystemDateMessage(message)) return groups;

            const dateStr = message.timestamp.toDateString();
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(message);
            return groups;
        }, {})
        : { 'all': processedMessages }; // If not grouping by date, put all messages in one group

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
        // System date messages don't have avatars
        if (isSystemDateMessage(messages[index])) return false;

        if (index === 0) return true;

        // If previous message was a system date message, always show avatar
        if (isSystemDateMessage(messages[index - 1])) return true;

        return messages[index].senderId !== messages[index - 1].senderId;
    };

    // Function to determine if a message should show the tail (arrow)
    const shouldShowTail = (messages: Message[], index: number): boolean => {
        return shouldShowAvatar(messages, index);
    };

    // Function to determine if a message is part of a sequence
    const isSequentialMessage = (messages: Message[], index: number): boolean => {
        // System date messages are never sequential
        if (isSystemDateMessage(messages[index])) return false;

        if (index === 0) return false;

        // If previous message was a system date message, not sequential
        if (isSystemDateMessage(messages[index - 1])) return false;

        return messages[index].senderId === messages[index - 1].senderId;
    };

    // Default WhatsApp pattern SVG
    const defaultPatternSvg = "url(/whatsapp-bg.png)";

    // Get background style based on prop
    const getChatBackgroundStyle = () => {
        if (backgroundImage) {
            return {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            };
        }
        return {
            backgroundImage: defaultPatternSvg
        };
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
        <div>
            <div ref={containerRef} className="w-[375px]">
                <div
                    ref={phoneRef}
                    className="bg-[#111b21] rounded-[40px] shadow-2xl overflow-hidden border-8 border-black"
                    style={getChatBackgroundStyle()}
                >
                    {/* Phone status bar */}
                    <div className="bg-black text-white h-7 flex items-center justify-between px-5 text-xs">
                        <div>{getCurrentTime()}</div>
                        <div className="flex items-center">
                            <span className="mr-1 text-xs">{phoneStatus.batteryLevel}%</span>
                            <Battery100Icon className="h-4 w-4" />
                        </div>
                    </div>

                    {/* WhatsApp header */}
                    <div className="bg-[#008069] text-white p-3 flex items-center justify-between">
                        <div className="flex items-center">
                            {/* Back arrow */}
                            <button className="text-white mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Avatar and chat info */}
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

                        {/* Action buttons */}
                        <div className="flex items-center space-x-4">
                            {/* Video call icon */}
                            <button className="text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v11.5A2.25 2.25 0 0 0 3.25 20h9.5A2.25 2.25 0 0 0 15 17.75V15l5.25 3.05a1 1 0 0 0 1.5-.85v-10.4a1 1 0 0 0-1.5-.85L15 9V6.25A2.25 2.25 0 0 0 12.75 4h-9.5Z"></path>
                                </svg>
                            </button>

                            {/* Voice call icon */}
                            <button className="text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M19.44 13c-.22 0-.45-.07-.67-.12a9.44 9.44 0 0 1-1.31-.39 2 2 0 0 0-2.48 1l-.22.45a12.18 12.18 0 0 1-2.66-2 12.18 12.18 0 0 1-2-2.66l.42-.28a2 2 0 0 0 1-2.48 10.33 10.33 0 0 1-.39-1.31c-.05-.22-.09-.45-.12-.68a3 3 0 0 0-3-2.49h-3a3 3 0 0 0-3 3.41 19 19 0 0 0 16.52 16.46h.38a3 3 0 0 0 2-.76 3 3 0 0 0 1-2.25v-3a3 3 0 0 0-2.47-2.9z"></path>
                                </svg>
                            </button>

                            {/* Three dots menu icon */}
                            <button className="text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Chat container */}
                    <div
                        className="p-3 h-[500px] overflow-y-auto custom-scrollbar"
                    >
                        {processedMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-700">
                                No messages yet
                            </div>
                        ) : (
                            Object.entries(messagesByDate).map(([dateStr, dateMessages]) => (
                                <div key={dateStr}>
                                    {/* Only show auto-generated date dividers if showDateDividers is true and we're not on 'all' */}
                                    {showDateDividers && dateStr !== 'all' && (
                                        <div className="flex justify-center my-3">
                                            <div className="bg-[#ffffff] px-3 py-1 rounded-lg text-xs text-gray-700 font-medium shadow-sm">
                                                {formatDate(new Date(dateStr))}
                                            </div>
                                        </div>
                                    )}

                                    {dateMessages.map((message, index) => {
                                        // If this is a system date message, render it as a date divider
                                        if (isSystemDateMessage(message)) {
                                            return (
                                                <div key={message.id} className="flex justify-center my-3">
                                                    <div className="bg-[#ffffff] px-3 py-1 rounded-lg text-xs text-gray-700 font-medium shadow-sm">
                                                        {message.text}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const sender = getParticipantById(message.senderId);
                                        const isMe = sender?.id === meId;
                                        const showName = mode === 'group' && !isMe && shouldShowAvatar(dateMessages, index);
                                        const showTail = shouldShowTail(dateMessages, index);
                                        const isSequential = isSequentialMessage(dateMessages, index);

                                        return (
                                            <div key={message.id} className={`${isSequential ? 'mb-0.5' : isMe ? 'mb-2' : 'mb-3'}`}>
                                                {showName && sender && (
                                                    <div className="text-xs text-gray-800 pl-10 mb-0.5">
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
                                                                        <div className="h-8 w-8 bg-[#cccccc] rounded-full flex items-center justify-center text-gray-800">
                                                                            {sender.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Message content */}
                                                    <div
                                                        className={`max-w-[70%] p-2 relative text-gray-800
                                                        ${isMe ? 'bg-[#d9fdd3]' : 'bg-[#ffffff]'} 
                                                        ${isSequential ? 'mt-0.5' : 'mt-0'} 
                                                        rounded-lg
                                                        ${!isSequential && isMe ? 'rounded-tr-none' : ''}
                                                        ${!isSequential && !isMe ? 'rounded-tl-none' : ''}
                                                        ${onMessageClick ? 'cursor-pointer hover:bg-opacity-90' : ''}
                                                        `}
                                                        onClick={() => onMessageClick?.(message)}
                                                    >
                                                        {/* Reply preview if this is a response */}
                                                        {message.replyToId && (
                                                            <div className={`mb-1 p-2 rounded border-l-4 ${isMe ? 'bg-[#c5f3c0] border-[#25d366]' : 'bg-[#f5f5f5] border-[#25d366]'}`}>
                                                                {(() => {
                                                                    const repliedMessage = getRepliedMessage(message.replyToId);
                                                                    const repliedSender = repliedMessage ? getParticipantById(repliedMessage.senderId) : undefined;
                                                                    return (
                                                                        <>
                                                                            <div className="text-[#25d366] font-medium text-sm">
                                                                                {repliedSender?.name || 'Unknown'}
                                                                            </div>
                                                                            <div className="text-gray-600 text-sm">
                                                                                {repliedMessage
                                                                                    ? getMessagePreview(repliedMessage)
                                                                                    : message.replyToPreview || 'Message not available'}
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                        {/* Message tail - only show for first message in a sequence */}
                                                        {showTail && (
                                                            <div
                                                                className={`absolute top-0 w-3 h-3 ${isMe ? 'right-0 -mr-1 bg-[#d9fdd3]' : 'left-0 -ml-1 bg-[#ffffff]'}`}
                                                                style={{
                                                                    transform: isMe ? 'skew(40deg)' : 'skew(-40deg)',
                                                                    borderRadius: '2px'
                                                                }}
                                                            />
                                                        )}

                                                        {message.type === 'audio' ? (
                                                            <div className="flex items-center space-x-2">
                                                                {/* Play button */}
                                                                <button className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                                        <path d="M8 5v14l11-7z" />
                                                                    </svg>
                                                                </button>

                                                                {/* Waveform */}
                                                                <div className="flex-1 h-[26px]">
                                                                    <div className="w-full h-full flex items-center">
                                                                        {[...Array(40)].map((_, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className={`flex-1 mx-[0.5px] ${isMe ? 'bg-[#2d7c64]' : 'bg-[#8696a0]'} opacity-40`}
                                                                                style={{
                                                                                    height: `${Math.abs(Math.sin((i + 1) * 0.5) * 100)}%`,
                                                                                    minHeight: '15%',
                                                                                    maxHeight: '95%'
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Duration */}
                                                                <div className="text-[13px] text-gray-600 whitespace-nowrap pl-1">
                                                                    {formatAudioDuration(message.audioDuration)}
                                                                </div>
                                                            </div>
                                                        ) : message.type === 'image' ? (
                                                            <div className="space-y-1 min-w-[200px]">
                                                                {/* Image container with fixed aspect ratio */}
                                                                <div className="relative w-full pt-[75%] rounded-lg overflow-hidden bg-gray-100">
                                                                    <img
                                                                        src={message.imageUrl}
                                                                        alt={message.imageCaption || "Image"}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            // Replace broken image with placeholder
                                                                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="%23cccccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Optional image caption */}
                                                                {message.imageCaption && (
                                                                    <div className="text-sm text-gray-800">
                                                                        {message.imageCaption}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-800">{message.text}</div>
                                                        )}

                                                        <div className="text-[10px] text-gray-600 text-right mt-1">
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
                    <div
                        className="p-2 flex items-center relative"
                    >
                        {/* Input content - above the overlay */}
                        <div className="flex-1 flex items-center bg-[#ffffff] rounded-full px-3 py-2 mr-2 z-10 relative">
                            {/* Sticker button */}
                            <button className="text-[#8696a0] mr-2 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                                    <path d="M8.5 9a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 8.5 9zm7 0a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 15.5 9zM12 17.5c-2.33 0-4.308-1.613-4.95-3.5h9.9c-.642 1.887-2.62 3.5-4.95 3.5z"></path>
                                </svg>
                            </button>

                            {/* Blinking cursor area (simulating text input) */}
                            <div className="flex-1 h-6 flex items-center">
                                <div className="h-4 w-0.5 bg-[#00a884] animate-pulse"></div>
                            </div>

                            {/* Right-side icons */}
                            <div className="flex items-center space-x-4 text-[#8696a0]">
                                {/* Attachment icon */}
                                <button className="flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M19.858 11.093l-5.4-5.4a4.225 4.225 0 0 0-5.971 0 4.225 4.225 0 0 0 0 5.971l5.4 5.4a2.539 2.539 0 0 0 3.6 0 2.539 2.539 0 0 0 0-3.6l-5.4-5.4a.849.849 0 0 0-1.2 0 .849.849 0 0 0 0 1.2l5.4 5.4a.849.849 0 1 1-1.2 1.2l-5.4-5.4a2.539 2.539 0 1 1 3.6-3.6l5.4 5.4a4.225 4.225 0 0 1-5.971 5.971l-5.4-5.4a5.9 5.9 0 0 1 0-8.341 5.9 5.9 0 0 1 8.341 0l5.4 5.4a.849.849 0 0 0 1.2-1.2Z"></path>
                                    </svg>
                                </button>

                                {/* Camera icon */}
                                <button className="flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-7.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"></path>
                                        <path d="M20.5 22h-17A2.5 2.5 0 0 1 1 19.5v-12A2.5 2.5 0 0 1 3.5 5h3.768l1.575-2.624A1.5 1.5 0 0 1 10.232 1.5h3.536a1.5 1.5 0 0 1 1.389.874L16.732 5H20.5A2.5 2.5 0 0 1 23 7.5v12a2.5 2.5 0 0 1-2.5 2.5ZM3.5 6.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1v-12a1 1 0 0 0-1-1h-4.232a.5.5 0 0 1-.429-.243L14.268 3H9.732L8.16 6.257a.5.5 0 0 1-.428.243H3.5Z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Microphone button */}
                        <button className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white flex-shrink-0 z-10 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 15.5c1.93 0 3.5-1.57 3.5-3.5V5.5c0-1.93-1.57-3.5-3.5-3.5S8.5 3.57 8.5 5.5V12c0 1.93 1.57 3.5 3.5 3.5Z"></path>
                                <path d="M12 18.5c-3.584 0-6.5-2.916-6.5-6.5v-1a.5.5 0 0 1 1 0v1c0 3.032 2.468 5.5 5.5 5.5s5.5-2.468 5.5-5.5v-1a.5.5 0 0 1 1 0v1c0 3.584-2.916 6.5-6.5 6.5Z"></path>
                                <path d="M12 21.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0v3a.5.5 0 0 1-.5.5Z"></path>
                                <path d="M15 21.5H9a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1Z"></path>
                            </svg>
                        </button>
                    </div>
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