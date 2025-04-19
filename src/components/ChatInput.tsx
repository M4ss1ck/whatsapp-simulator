import { useState } from 'react';
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
    const [messageType, setMessageType] = useState<'text' | 'audio'>('text');
    const [audioDuration, setAudioDuration] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParticipant) return;

        if (messageType === 'audio' && !audioDuration) {
            alert('Please enter the audio duration');
            return;
        }

        onMessageSend({
            senderId: selectedParticipant.id,
            text: messageType === 'audio' ? 'Audio message' : messageText,
            timestamp: new Date(),
            type: messageType,
            audioDuration: messageType === 'audio' ? audioDuration : undefined
        });

        setMessageText('');
        setAudioDuration('');
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
            ) : (
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
            )}

            <button
                type="submit"
                onClick={handleSubmit}
                disabled={!selectedParticipant || (messageType === 'text' && !messageText.trim())}
                className="bg-[#00a884] text-white px-4 py-2 rounded disabled:opacity-50"
            >
                Send Message
            </button>
        </div>
    );
} 