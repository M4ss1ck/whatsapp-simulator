// Sibling source of truth: whatsapp-renderer/src/remotion/components/ChatPhone.tsx
import { useMemo, type Ref } from 'react';
import { Battery100Icon } from '@heroicons/react/24/solid';
import { Message, Participant, PhoneStatusBar } from '../types';
import { ChatMode } from './ChatSettings';
import { buildWaveformHeights } from '../utils/seededRandom';

interface ChatPhoneProps {
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
  phoneRef?: Ref<HTMLDivElement>;
  currentTime?: Date;
  locale?: string;
  timeZone?: string;
  defaultBackgroundImage?: string;
}

const formatAudioDuration = (duration: string | undefined): string => {
  if (!duration) return '0:00';

  const parts = duration.split(':');
  if (parts.length === 2) return duration;
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts[2];
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes}:${seconds}`;
  }

  return '0:00';
};

const AudioWaveform = ({ seed }: { seed: string }) => {
  const bars = useMemo(() => buildWaveformHeights(seed, 40), [seed]);

  return (
    <div className="w-full h-full flex items-center relative">
      {bars.map((height, index) => (
        <div
          key={index}
          className="flex-1 mx-[0.5px] transition-all duration-200 bg-[#8696a0] border-[#8696a0]"
          style={{
            height: `${height}%`,
            minHeight: '15%',
            maxHeight: '95%',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '2px',
            opacity: 0.8
          }}
        />
      ))}
    </div>
  );
};

export default function ChatPhone({
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
  onMessageClick,
  phoneRef,
  currentTime,
  locale,
  timeZone,
  defaultBackgroundImage = '/whatsapp-bg.png'
}: ChatPhoneProps) {
  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    });
  }, [locale, timeZone]);

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone
    });
  }, [locale, timeZone]);

  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((participant) => participant.id === id);
  };

  const getRepliedMessage = (replyToId: string): Message | undefined => {
    return messages.find((message) => message.id === replyToId);
  };

  const getMessagePreview = (message: Message): string => {
    switch (message.type) {
      case 'audio':
        return 'Voice message';
      case 'image':
        return message.imageCaption || 'Photo';
      default:
        return message.text.length > 50 ? `${message.text.substring(0, 47)}...` : message.text;
    }
  };

  const formatTime = (date: Date): string => {
    if (phoneStatus.customTime && phoneStatus.customTime.trim() !== '') {
      return phoneStatus.customTime;
    }
    return timeFormatter.format(date);
  };

  const getCurrentTime = (): string => {
    if (phoneStatus.customTime && phoneStatus.customTime.trim() !== '') {
      return phoneStatus.customTime;
    }
    const now = currentTime ?? new Date();
    return timeFormatter.format(now);
  };

  const formatDate = (date: Date): string => {
    if (customDateFormat) {
      return customDateFormat(date);
    }
    return dateFormatter.format(date);
  };

  const isSystemDateMessage = (message: Message): boolean => {
    return message.senderId === 'system_date';
  };

  const processedMessages = messages.reduce<Message[]>((result, message, index, array) => {
    if (isSystemDateMessage(message) && index > 0 && isSystemDateMessage(array[index - 1])) {
      return result;
    }
    result.push(message);
    return result;
  }, []);

  const shouldGroupByDate = showDateDividers && !processedMessages.some(isSystemDateMessage);

  const messagesByDate = shouldGroupByDate
    ? processedMessages.reduce<Record<string, Message[]>>((groups, message) => {
      if (isSystemDateMessage(message)) return groups;

      const dateKey = message.timestamp.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
      return groups;
    }, {})
    : { all: processedMessages };

  const otherParticipant = mode === 'private' && meId
    ? participants.find((participant) => participant.id !== meId)
    : null;

  const chatTitle = mode === 'private' && otherParticipant ? otherParticipant.name : groupTitle;
  const chatAvatar = mode === 'private' && otherParticipant ? otherParticipant.avatar : groupAvatar;

  const participantsList = mode === 'group'
    ? participants.map((participant) => participant.name).join(', ')
    : '';

  const shouldShowAvatar = (messageList: Message[], index: number): boolean => {
    if (isSystemDateMessage(messageList[index])) return false;
    if (index === 0) return true;
    if (isSystemDateMessage(messageList[index - 1])) return true;
    return messageList[index].senderId !== messageList[index - 1].senderId;
  };

  const shouldShowTail = (messageList: Message[], index: number): boolean => {
    return shouldShowAvatar(messageList, index);
  };

  const isSequentialMessage = (messageList: Message[], index: number): boolean => {
    if (isSystemDateMessage(messageList[index])) return false;
    if (index === 0) return false;
    if (isSystemDateMessage(messageList[index - 1])) return false;
    return messageList[index].senderId === messageList[index - 1].senderId;
  };

  const getChatBackgroundStyle = () => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      backgroundImage: `url(${defaultBackgroundImage})`
    };
  };

  return (
    <div className="w-[375px]">
      <div
        ref={phoneRef}
        className="bg-[#111b21] rounded-[40px] shadow-2xl overflow-hidden border-8 border-black"
        style={getChatBackgroundStyle()}
      >
        <div className="bg-black text-white h-7 flex items-center justify-between px-5 text-xs">
          <div>{getCurrentTime()}</div>
          <div className="flex items-center">
            <span className="mr-1 text-xs">{phoneStatus.batteryLevel}%</span>
            <Battery100Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#008069] text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <button className="text-white mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>

            {chatAvatar ? (
              <img
                src={chatAvatar}
                alt={chatTitle || ''}
                className="h-10 w-10 rounded-full mr-3 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
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

          <div className="flex items-center space-x-4">
            <button className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v11.5A2.25 2.25 0 0 0 3.25 20h9.5A2.25 2.25 0 0 0 15 17.75V15l5.25 3.05a1 1 0 0 0 1.5-.85v-10.4a1 1 0 0 0-1.5-.85L15 9V6.25A2.25 2.25 0 0 0 12.75 4h-9.5Z"></path>
              </svg>
            </button>

            <button className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M19.44 13c-.22 0-.45-.07-.67-.12a9.44 9.44 0 0 1-1.31-.39 2 2 0 0 0-2.48 1l-.22.45a12.18 12.18 0 0 1-2.66-2 12.18 12.18 0 0 1-2-2.66l.42-.28a2 2 0 0 0 1-2.48 10.33 10.33 0 0 1-.39-1.31c-.05-.22-.09-.45-.12-.68a3 3 0 0 0-3-2.49h-3a3 3 0 0 0-3 3.41 19 19 0 0 0 16.52 16.46h.38a3 3 0 0 0 2-.76 3 3 0 0 0 1-2.25v-3a3 3 0 0 0-2.47-2.9z"></path>
              </svg>
            </button>

            <button className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 h-[500px] overflow-y-auto custom-scrollbar overflow-x-hidden">
          {processedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-700">
              No messages yet
            </div>
          ) : (
            Object.entries(messagesByDate).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {showDateDividers && dateKey !== 'all' && (
                  <div className="flex justify-center my-3">
                    <div className="bg-[#ffffff] px-3 py-1 rounded-lg text-xs text-gray-700 font-medium shadow-sm">
                      {formatDate(dateMessages[0].timestamp)}
                    </div>
                  </div>
                )}

                {dateMessages.map((message, index) => {
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
                        {!isMe && (
                          <div className="self-end mr-1 min-w-[36px] w-9 flex justify-center">
                            {!isSequential && sender && (
                              <>
                                {sender.avatar ? (
                                  <img
                                    src={sender.avatar}
                                    alt={sender.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none';
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
                              <button className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </button>

                              <div className="flex-1 h-[26px] relative">
                                <AudioWaveform seed={message.id} />
                              </div>

                              <div className="text-[13px] text-gray-600 whitespace-nowrap pl-1">
                                {formatAudioDuration(message.audioDuration)}
                              </div>
                            </div>
                          ) : message.type === 'image' ? (
                            <div className="space-y-1 min-w-[200px]">
                              <div className="relative w-full pt-[75%] rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={message.imageUrl}
                                  alt={message.imageCaption || 'Image'}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="%23cccccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                                  }}
                                />
                              </div>

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

        <div className="p-2 pt-1 flex items-center relative bg-transparent">
          <div className="flex-1 flex items-center bg-[#ffffff] rounded-full px-3 py-2 mr-2 z-10 relative">
            <button className="text-[#8696a0] mr-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                <path d="M8.5 9a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 8.5 9zm7 0a1.5 1.5 0 1 1-.001 3.999A2 2 0 0 1 15.5 9zM12 17.5c-2.33 0-4.308-1.613-4.95-3.5h9.9c-.642 1.887-2.62 3.5-4.95 3.5z"></path>
              </svg>
            </button>

            <div className="flex-1 h-6 flex items-center">
              <div className="h-4 w-0.5 bg-[#00a884] animate-pulse"></div>
            </div>

            <div className="flex items-center space-x-4 text-[#8696a0]">
              <button className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.858 11.093l-5.4-5.4a4.225 4.225 0 0 0-5.971 0 4.225 4.225 0 0 0 0 5.971l5.4 5.4a2.539 2.539 0 0 0 3.6 0 2.539 2.539 0 0 0 0-3.6l-5.4-5.4a.849.849 0 0 0-1.2 0 .849.849 0 0 0 0 1.2l5.4 5.4a.849.849 0 1 1-1.2 1.2l-5.4-5.4a2.539 2.539 0 1 1 3.6-3.6l5.4 5.4a4.225 4.225 0 0 1-5.971 5.971l-5.4-5.4a5.9 5.9 0 0 1 0-8.341 5.9 5.9 0 0 1 8.341 0l5.4 5.4a.849.849 0 0 0 1.2-1.2Z"></path>
                </svg>
              </button>

              <button className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-7.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"></path>
                  <path d="M20.5 22h-17A2.5 2.5 0 0 1 1 19.5v-12A2.5 2.5 0 0 1 3.5 5h3.768l1.575-2.624A1.5 1.5 0 0 1 10.232 1.5h3.536a1.5 1.5 0 0 1 1.389.874L16.732 5H20.5A2.5 2.5 0 0 1 23 7.5v12a2.5 2.5 0 0 1-2.5 2.5ZM3.5 6.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1v-12a1 1 0 0 0-1-1h-4.232a.5.5 0 0 1-.429-.243L14.268 3H9.732L8.16 6.257a.5.5 0 0 1-.428.243H3.5Z"></path>
                </svg>
              </button>
            </div>
          </div>

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
  );
}
