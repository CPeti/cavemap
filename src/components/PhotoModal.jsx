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
    }, [selectedPhoto, photoIndex, handleKeyDown]);

    if (!selectedPhoto) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-3 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 shadow-lg"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Navigation Buttons */}
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('prev');
                            }}
                            disabled={photoIndex === 0}
                            className="absolute left-6 z-10 p-4 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('next');
                            }}
                            disabled={photoIndex === photos.length - 1}
                            className="absolute right-6 z-10 p-4 bg-black bg-opacity-60 backdrop-blur-sm text-white rounded-full hover:bg-opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Image Container */}
                <div
                    className="relative max-w-full max-h-full flex items-center justify-center"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                        }
                    }}
                >
                    <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.caption || selectedPhoto.filename || 'Cave photo'}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />

                    {/* Photo Info */}
                    {(selectedPhoto.caption || selectedPhoto.photographer) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-sm text-white p-6 rounded-b-lg">
                            {selectedPhoto.caption && (
                                <h3 className="font-semibold text-xl mb-2">{selectedPhoto.caption}</h3>
                            )}
                            <div className="flex justify-between items-center text-sm text-gray-300">
                                <div>
                                    {selectedPhoto.photographer && (
                                        <span className="font-medium">Photo by {selectedPhoto.photographer}</span>
                                    )}
                                </div>
                                <div>
                                    {photos.length > 1 && (
                                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-medium">
                                            {photoIndex + 1} of {photos.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}