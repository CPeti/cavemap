import { useEffect, useCallback } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function PhotoModal({
    selectedPhoto,
    photos,
    photoIndex,
    onClose,
    onNavigate
}) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowRight') {
            onNavigate('next');
        } else if (e.key === 'ArrowLeft') {
            onNavigate('prev');
        }
    }, [onClose, onNavigate]);

    useEffect(() => {
        if (selectedPhoto) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [selectedPhoto, handleKeyDown]);

    if (!selectedPhoto) return null;

    const validPhotos = Array.isArray(photos) ? photos : [];

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 z-[9999]"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-1 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        {validPhotos.length > 1 && (
                            <span className="text-sm font-medium text-gray-600">
                                {photoIndex + 1} of {validPhotos.length}
                            </span>
                        )}
                        {selectedPhoto.caption && (
                            <h3 className="font-semibold text-gray-900 truncate">
                                {selectedPhoto.caption}
                            </h3>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Image Container */}
                <div className="relative flex items-center justify-center bg-gray-50 p-4">
                    <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.caption || selectedPhoto.filename || 'Photo'}
                        className="max-h-[70vh] object-contain rounded-lg shadow-md"
                    />

                    {/* Navigation Buttons */}
                    {validPhotos.length > 1 && (
                        <>
                            <button
                                onClick={() => onNavigate('prev')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/80 shadow-md rounded-full hover:bg-white transition"
                            >
                                <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
                            </button>

                            <button
                                onClick={() => onNavigate('next')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/80 shadow-md rounded-full hover:bg-white transition"
                            >
                                <ChevronRightIcon className="w-6 h-6 text-gray-700" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
