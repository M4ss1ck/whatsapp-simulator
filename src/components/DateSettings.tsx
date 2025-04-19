import React from 'react';

interface DateSettingsProps {
    showDateDividers: boolean;
    onShowDateDividersChange: (value: boolean) => void;
    customDateText: string;
    onCustomDateTextChange: (value: string) => void;
    onAddDateMessage: () => void;
}

const DateSettings: React.FC<DateSettingsProps> = ({
    showDateDividers,
    onShowDateDividersChange,
    customDateText,
    onCustomDateTextChange,
    onAddDateMessage,
}) => {
    return (
        <div className="phone-settings p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Date Settings</h2>

            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <input
                        type="checkbox"
                        id="show-dates"
                        checked={showDateDividers}
                        onChange={() => onShowDateDividersChange(!showDateDividers)}
                        className="mr-2 accent-primary"
                    />
                    <label htmlFor="show-dates" className="text-sm font-medium">
                        Show automatic date dividers
                    </label>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                    When enabled, messages will be grouped by date with date headers.
                </p>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold mb-2">Add Custom Date Message</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customDateText}
                            onChange={(e) => onCustomDateTextChange(e.target.value)}
                            placeholder="e.g., 'Yesterday' or 'Last week'"
                            className="w-full p-2 border rounded time-input"
                            disabled={!showDateDividers}
                        />
                        <button
                            onClick={onAddDateMessage}
                            disabled={!customDateText.trim() || !showDateDividers}
                            className="bg-primary text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Add custom date separators between messages.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DateSettings; 