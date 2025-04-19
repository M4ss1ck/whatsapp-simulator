import React from 'react';

interface BackgroundSettingsProps {
    backgroundImage: string;
    onBackgroundImageChange: (value: string) => void;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
    backgroundImage,
    onBackgroundImageChange,
}) => {
    return (
        <div className="phone-settings p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Chat Background</h2>

            <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                    The WhatsApp pattern background is currently using a custom image.
                </p>

                <div className="mt-4">
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
            </div>
        </div>
    );
};

export default BackgroundSettings; 