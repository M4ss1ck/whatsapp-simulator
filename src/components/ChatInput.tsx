import React, { useState, useRef } from 'react';
import { Message, Participant } from '../types';

interface ChatInputProps {
    participants: Participant[];
    selectedParticipant: Participant | null;
    onParticipantChange: (participant: Participant) => void;
    onMessageSend: (message: Omit<Message, 'id'>) => void;
    replyToMessage?: Message; // Message being replied to
    onCancelReply?: () => void; // Function to cancel reply
}

export default function ChatInput({
    participants,
    selectedParticipant,
    onParticipantChange,
    onMessageSend,
    replyToMessage,
    onCancelReply
}: ChatInputProps) {
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState<'text' | 'audio' | 'image'>('text');
    const [audioDuration, setAudioDuration] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            setSelectedFile(file);

            // Read the file as a data URL
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageData(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);

            setImageUrl(''); // Clear URL input when file is selected
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParticipant) return;

        if (messageType === 'audio' && !audioDuration) {
            alert('Please enter the audio duration');
            return;
        }

        if (messageType === 'image') {
            if (imageData === null && !imageUrl) {
                alert('Please select an image or enter an image URL');
                return;
            }
        }

        const message: Omit<Message, 'id'> = {
            senderId: selectedParticipant.id,
            text: messageType === 'text' ? messageText : messageType === 'audio' ? 'Audio message' : (imageCaption || 'Image'),
            timestamp: new Date(),
            type: messageType,
            ...(messageType === 'audio' && { audioDuration }),
            ...(messageType === 'image' && {
                imageUrl: imageData || imageUrl,
                ...(imageCaption && { imageCaption })
            }),
            ...(replyToMessage && {
                replyToId: replyToMessage.id,
                replyToPreview: getMessagePreview(replyToMessage),
                replyToType: replyToMessage.type
            })
        };

        onMessageSend(message);

        // Reset form
        setMessageText('');
        setAudioDuration('');
        setImageUrl('');
        setImageCaption('');
        setSelectedFile(null);
        setImageData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onCancelReply) {
            onCancelReply();
        }
    };

    return (
        <div className="chat-input p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Send Message</h2>

            {/* Reply preview */}
            {replyToMessage && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg relative">
                    <button
                        onClick={onCancelReply}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="text-sm font-medium text-gray-700">
                        Replying to message:
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        {getMessagePreview(replyToMessage)}
                    </div>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Sender:</label>
                <select
                    value={selectedParticipant?.id || ''}
                    onChange={(e) => {
                        const participant = participants.find(p => p.id === e.target.value);
                        if (participant) onParticipantChange(participant);
                    }}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Select a participant</option>
                    {participants.map(participant => (
                        <option key={participant.id} value={participant.id}>
                            {participant.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Message Type:</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="text"
                            checked={messageType === 'text'}
                            onChange={() => setMessageType('text')}
                            className="mr-2"
                        />
                        Text
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="audio"
                            checked={messageType === 'audio'}
                            onChange={() => setMessageType('audio')}
                            className="mr-2"
                        />
                        Audio
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="image"
                            checked={messageType === 'image'}
                            onChange={() => setMessageType('image')}
                            className="mr-2"
                        />
                        Image
                    </label>
                </div>
            </div>

            {messageType === 'text' ? (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Message:</label>
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full p-2 border rounded"
                        rows={3}
                    />
                </div>
            ) : messageType === 'audio' ? (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Audio Duration (HH:MM:SS):</label>
                    <input
                        type="text"
                        value={audioDuration}
                        onChange={(e) => setAudioDuration(e.target.value)}
                        placeholder="00:00:00"
                        className="w-full p-2 border rounded"
                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Enter duration in HH:MM:SS format (e.g., 00:01:30 for 1 minute and 30 seconds)
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Paste image URL:</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => {
                                    setImageUrl(e.target.value);
                                    if (selectedFile) {
                                        setSelectedFile(null);
                                        setImageData(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }
                                }}
                                placeholder="https://example.com/image.jpg"
                                className="w-full p-2 border rounded"
                            />
                            {imageUrl && !imageData && (
                                <div className="mt-4">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-w-full h-auto rounded max-h-48 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 text-gray-500 bg-white">OR</span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-[#00a884] text-white py-3 px-4 rounded text-center cursor-pointer">
                                Choose Image
                            </div>
                            {selectedFile && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                            {imageData && (
                                <div className="mt-4">
                                    <img
                                        src={imageData}
                                        alt="Preview"
                                        className="max-w-full h-auto rounded max-h-48 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Image Caption (optional):</label>
                        <input
                            type="text"
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            placeholder="Add a caption..."
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
            )}

            <button
                type="submit"
                onClick={handleSubmit}
                disabled={!selectedParticipant ||
                    (messageType === 'text' && !messageText.trim()) ||
                    (messageType === 'audio' && !audioDuration) ||
                    (messageType === 'image' && imageData === null && !imageUrl)}
                className="bg-[#00a884] text-white px-4 py-2 rounded disabled:opacity-50"
            >
                Send Message
            </button>
        </div>
    );
} 