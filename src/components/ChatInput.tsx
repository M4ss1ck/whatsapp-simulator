import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
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
    const [customTimestamp, setCustomTimestamp] = useState<string>('');
    const [useCustomTimestamp, setUseCustomTimestamp] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim() || !selectedParticipant) return;

        const timestamp = useCustomTimestamp && customTimestamp
            ? new Date(customTimestamp)
            : new Date();

        onMessageSend({
            senderId: selectedParticipant.id,
            text: messageText,
            timestamp,
        });

        setMessageText('');
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Send as:</label>
                <select
                    className="w-full p-2 border rounded"
                    value={selectedParticipant?.id || ''}
                    onChange={(e) => {
                        const participant = participants.find(p => p.id === e.target.value);
                        if (participant) onParticipantChange(participant);
                    }}
                >
                    <option value="" disabled>Select participant</option>
                    {participants.map(participant => (
                        <option key={participant.id} value={participant.id}>
                            {participant.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <div className="flex items-center mb-1">
                    <input
                        type="checkbox"
                        id="custom-timestamp"
                        checked={useCustomTimestamp}
                        onChange={() => setUseCustomTimestamp(!useCustomTimestamp)}
                        className="mr-2"
                    />
                    <label htmlFor="custom-timestamp" className="text-sm font-medium">
                        Custom timestamp
                    </label>
                </div>

                {useCustomTimestamp && (
                    <input
                        type="datetime-local"
                        value={customTimestamp}
                        onChange={(e) => setCustomTimestamp(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex">
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message"
                    className="flex-grow p-2 border rounded-l"
                    disabled={!selectedParticipant}
                />
                <button
                    type="submit"
                    className="bg-[#00a884] text-white p-2 rounded-r"
                    disabled={!messageText.trim() || !selectedParticipant}
                >
                    <PaperAirplaneIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
} 