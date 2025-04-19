import React, { useState, useRef } from 'react';
import { Message, Participant } from '../types';

interface ChatInputProps {
    participants: Participant[];
    selectedParticipant: Participant | null;
    onParticipantChange: (participant: Participant) => void;
    onMessageSend: (message: Omit<Message, 'id'>) => void;
}

export default function ChatInput({
    participants,
    selectedParticipant,
    onParticipantChange,
    onMessageSend
}: ChatInputProps) {
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState<'text' | 'audio' | 'image'>('text');
    const [audioDuration, setAudioDuration] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);

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
            if (uploadMethod === 'url' && !imageUrl) {
                alert('Please enter an image URL');
                return;
            }
            if (uploadMethod === 'file' && !selectedFile) {
                alert('Please select an image file');
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
                imageUrl: uploadMethod === 'file' ? imageData! : imageUrl,
                ...(imageCaption && { imageCaption })
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
    };

    return (
        <div className="chat-input p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Send Message</h2>

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
                    <div>
                        <label className="block text-sm font-medium mb-1">Upload Method:</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="file"
                                    checked={uploadMethod === 'file'}
                                    onChange={() => setUploadMethod('file')}
                                    className="mr-2"
                                />
                                Upload File
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="url"
                                    checked={uploadMethod === 'url'}
                                    onChange={() => setUploadMethod('url')}
                                    className="mr-2"
                                />
                                Image URL
                            </label>
                        </div>
                    </div>

                    {uploadMethod === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium mb-1">Choose Image:</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="w-full p-2 border rounded"
                            />
                            {imageData && (
                                <div className="mt-2">
                                    <img
                                        src={imageData}
                                        alt="Preview"
                                        className="max-w-full h-auto rounded-lg max-h-48 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL:</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full p-2 border rounded"
                            />
                            {imageUrl && (
                                <div className="mt-2">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-w-full h-auto rounded-lg max-h-48 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div>
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
                    (messageType === 'image' && uploadMethod === 'url' && !imageUrl) ||
                    (messageType === 'image' && uploadMethod === 'file' && !selectedFile)}
                className="bg-[#00a884] text-white px-4 py-2 rounded disabled:opacity-50"
            >
                Send Message
            </button>
        </div>
    );
} 