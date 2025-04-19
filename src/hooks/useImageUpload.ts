import { useState, useRef } from 'react';

interface UseImageUploadResult {
    imageUrl: string;
    imageData: string | null;
    selectedFile: File | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUrlChange: (url: string) => void;
    resetImage: () => void;
}

export function useImageUpload(): UseImageUploadResult {
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleUrlChange = (url: string) => {
        setImageUrl(url);
        if (selectedFile) {
            setSelectedFile(null);
            setImageData(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const resetImage = () => {
        setImageUrl('');
        setSelectedFile(null);
        setImageData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        imageUrl,
        imageData,
        selectedFile,
        fileInputRef,
        handleFileSelect,
        handleUrlChange,
        resetImage
    };
} 