import React, { useRef, useState } from 'react';

interface BackgroundSettingsProps {
    backgroundImage: string;
    onBackgroundImageChange: (value: string) => void;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
    backgroundImage,
    onBackgroundImageChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onBackgroundImageChange(dataUrl);
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

    return (
        <div className="phone-settings p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Chat Background</h2>

            <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                    The WhatsApp pattern background is currently using a custom image.
                </p>

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Custom Background URL:</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={backgroundImage}
                                onChange={(e) => onBackgroundImageChange(e.target.value)}
                                placeholder="Enter image URL"
                                className="w-full p-2 border rounded time-input"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="text-sm font-medium mb-2 block">Upload Image:</label>
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
                            Upload an image from your device to use as background.
                        </p>
                    </div>

                    {backgroundImage && (
                        <div className="mt-4">
                            <label className="text-sm font-medium mb-2 block">Preview:</label>
                            <div className="relative w-full h-32 border rounded overflow-hidden">
                                <img
                                    src={backgroundImage}
                                    alt="Background preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BackgroundSettings; 