import { useState, useRef } from 'react';
import { UserPlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Participant } from '../types';

interface ParticipantManagerProps {
    participants: Participant[];
    onAddParticipant: (participant: Omit<Participant, 'id'>) => void;
    onRemoveParticipant: (id: string) => void;
    onUpdateParticipant: (participant: Participant) => void;
    onSetAsMe: (id: string) => void;
    meId: string | null;
}

export default function ParticipantManager({
    participants,
    onAddParticipant,
    onRemoveParticipant,
    onUpdateParticipant,
    onSetAsMe,
    meId
}: ParticipantManagerProps) {
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setAvatarUrl(dataUrl);
            setIsUploading(false);
        };

        reader.onerror = () => {
            setIsUploading(false);
            alert('Error uploading image. Please try again.');
        };

        reader.readAsDataURL(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        onAddParticipant({
            name,
            avatar: avatarUrl.trim() || null
        });

        setName('');
        setAvatarUrl('');
    };

    return (
        <div className="participant-manager p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Participants</h2>

            <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter name"
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Avatar:</label>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Avatar URL:</label>
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="Enter image URL"
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <label className="block text-sm font-medium mb-1">Upload Image:</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="w-full bg-primary text-white px-3 py-2 rounded disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : 'Choose Image'}
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                                Upload an image from your device to use as avatar.
                            </p>
                        </div>

                        <div className="flex justify-center">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar preview"
                                    className="h-16 w-16 rounded-full object-cover border-2 border-[#00a884]"
                                    onError={() => setAvatarUrl('')}
                                />
                            ) : (
                                <div className="h-16 w-16 bg-[#00a884] rounded-full flex items-center justify-center text-white text-xl font-semibold">
                                    {name ? name.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="bg-[#00a884] text-white px-4 py-2 rounded flex items-center"
                >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Add Participant
                </button>
            </form>

            <div>
                <h3 className="text-md font-medium mb-2">Participant List:</h3>
                {participants.length === 0 ? (
                    <p className="text-gray-500">No participants added yet</p>
                ) : (
                    <ul className="space-y-2">
                        {participants.map(participant => (
                            <li key={participant.id} className="py-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    {participant.avatar ? (
                                        <img
                                            src={participant.avatar}
                                            alt={participant.name}
                                            className="h-8 w-8 rounded-full mr-2 object-cover"
                                            onError={() => {
                                                // If image fails to load, update participant with null avatar
                                                onUpdateParticipant({
                                                    ...participant,
                                                    avatar: null
                                                });
                                            }}
                                        />
                                    ) : (
                                        <div className="h-8 w-8 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                                            {participant.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-medium">{participant.name}</span>
                                    {meId === participant.id && (
                                        <span className="ml-2 text-xs bg-[#00a884] text-white px-1.5 py-0.5 rounded">Me</span>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    {meId !== participant.id && (
                                        <button
                                            onClick={() => onSetAsMe(participant.id)}
                                            className="text-[#00a884] hover:text-[#008069] mr-3 text-sm"
                                        >
                                            Set as Me
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onRemoveParticipant(participant.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
} 