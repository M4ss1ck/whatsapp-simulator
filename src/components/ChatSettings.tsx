import { useRef, useState } from 'react';
import { Participant } from '../types';

export type ChatMode = 'group' | 'private';

interface ChatSettingsProps {
    mode: ChatMode;
    onModeChange: (mode: ChatMode) => void;
    participants: Participant[];
    meId: string | null;
    title: string;
    onTitleChange: (title: string) => void;
    avatar: string | null;
    onAvatarChange: (avatar: string | null) => void;
}

export default function ChatSettings({
    mode,
    onModeChange,
    participants,
    meId,
    title,
    onTitleChange,
    avatar,
    onAvatarChange
}: ChatSettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Need at least 2 participants for any chat
    const hasEnoughParticipants = participants.length >= 2;
    // Need exactly 2 participants for private chat
    const validForPrivateChat = participants.length === 2;
    // Need to have a "me" participant
    const hasMe = meId !== null;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onAvatarChange(dataUrl);
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

    // Error messages
    const getErrorMessage = () => {
        if (!hasEnoughParticipants) return 'Need at least 2 participants for a chat';
        if (mode === 'private' && !validForPrivateChat) return 'Private chat requires exactly 2 participants';
        if (!hasMe) return 'You need to mark one participant as "Me"';
        return null;
    };

    const errorMessage = getErrorMessage();

    // Get the other participant in private chat (not me)
    const otherParticipant = meId && mode === 'private'
        ? participants.find(p => p.id !== meId)
        : null;

    return (
        <div className="chat-settings p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Chat Settings</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Chat Mode:</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="group"
                            checked={mode === 'group'}
                            onChange={() => onModeChange('group')}
                            className="mr-2"
                        />
                        Group Chat
                    </label>

                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="private"
                            checked={mode === 'private'}
                            onChange={() => onModeChange('private')}
                            disabled={!validForPrivateChat}
                            className="mr-2"
                        />
                        Private Chat
                        {!validForPrivateChat && (
                            <span className="text-xs text-red-500 ml-1">(needs exactly 2 participants)</span>
                        )}
                    </label>
                </div>
            </div>

            {mode === 'group' && (
                <>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Group Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder="Enter group name"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Group Image:</label>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">URL:</label>
                                <input
                                    type="text"
                                    value={avatar || ''}
                                    onChange={(e) => onAvatarChange(e.target.value ? e.target.value : null)}
                                    placeholder="Enter image URL"
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div className="relative border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white dark:bg-gray-800 px-2 text-sm text-gray-500">OR</div>
                                <label className="block text-sm font-medium mb-1">Upload:</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                    className="w-full bg-primary text-white px-3 py-2 rounded disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Choose Image'}
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload an image from your device
                                </p>
                            </div>

                            <div className="flex justify-center">
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt="Group image preview"
                                        className="h-16 w-16 rounded-full object-cover border-2 border-[#00a884]"
                                        onError={() => onAvatarChange(null)}
                                    />
                                ) : (
                                    <div className="h-16 w-16 bg-[#00a884] rounded-full flex items-center justify-center text-white text-xl font-semibold">
                                        {title ? title.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {mode === 'private' && otherParticipant && (
                <div className="text-sm mt-2">
                    <div className="mb-1 font-medium">Private chat with:</div>
                    <div className="flex items-center p-2 bg-gray-200 rounded-lg">
                        {otherParticipant.avatar ? (
                            <img
                                src={otherParticipant.avatar}
                                alt={otherParticipant.name}
                                className="h-8 w-8 rounded-full mr-2"
                            />
                        ) : (
                            <div className="h-8 w-8 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                                {otherParticipant.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="font-medium">{otherParticipant.name}</span>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="mt-3 text-red-500 text-sm">
                    {errorMessage}
                </div>
            )}
        </div>
    );
} 