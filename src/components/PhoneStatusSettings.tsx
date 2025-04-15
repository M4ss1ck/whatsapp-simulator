import { useState } from 'react';
import { PhoneStatusBar } from '../types';

interface PhoneStatusSettingsProps {
    batteryLevel: number;
    customTime: string | null;
    onStatusChange: (status: PhoneStatusBar) => void;
}

export default function PhoneStatusSettings({
    batteryLevel,
    customTime,
    onStatusChange
}: PhoneStatusSettingsProps) {
    const [showCustomTime, setShowCustomTime] = useState(!!customTime);
    const [timeValue, setTimeValue] = useState(customTime || '');

    const handleBatteryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newBatteryLevel = Number(e.target.value);
        onStatusChange({
            batteryLevel: newBatteryLevel,
            customTime: showCustomTime && timeValue.trim() !== '' ? timeValue : null
        });
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTimeValue(newTime);
        onStatusChange({
            batteryLevel,
            customTime: newTime.trim() !== '' ? newTime : null
        });
    };

    const handleToggleCustomTime = () => {
        const newShowCustomTime = !showCustomTime;
        setShowCustomTime(newShowCustomTime);
        onStatusChange({
            batteryLevel,
            customTime: newShowCustomTime && timeValue.trim() !== '' ? timeValue : null
        });
    };

    return (
        <div className="phone-settings p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Phone Settings</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Battery Level: {batteryLevel}%
                </label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={batteryLevel}
                    onChange={handleBatteryChange}
                    className="w-full accent-primary"
                />
            </div>

            <div className="mb-4">
                <div className="flex items-center mb-1">
                    <input
                        type="checkbox"
                        id="custom-time"
                        checked={showCustomTime}
                        onChange={handleToggleCustomTime}
                        className="mr-2 accent-primary"
                    />
                    <label htmlFor="custom-time" className="text-sm font-medium">
                        Custom Time
                    </label>
                </div>

                {showCustomTime && (
                    <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full p-2 border rounded time-input"
                    />
                )}
            </div>
        </div>
    );
} 