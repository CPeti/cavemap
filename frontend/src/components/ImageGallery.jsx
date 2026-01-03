import React, { useState, useEffect, useRef } from "react";
import {
    PhotoIcon,
    PlusIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { getApiUrl } from "../config";

const ImageGallery = ({
    images = [],
    canEdit = false,
    onUploadClick,
    onRemoveImage,
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullResolutionOpen, setIsFullResolutionOpen] = useState(false);
    const modalRef = useRef(null);

    const goToPrevious = () => {
        setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : images.length - 1
        );
    };

    const goToNext = () => {
        setCurrentImageIndex((prev) =>
            prev < images.length - 1 ? prev + 1 : 0
        );
    };

    const openFullResolution = () => {
        setIsFullResolutionOpen(true);
    };

    const closeFullResolution = () => {
        setIsFullResolutionOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            closeFullResolution();
        }
    };

    useEffect(() => {
        if (isFullResolutionOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isFullResolutionOpen]);

    return (
        <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white flex items-center gap-2">
                    <PhotoIcon className="w-4 h-4 text-teal-400" />
                    Image Gallery
                    <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {images.length}
                    </span>
                </h2>
                {canEdit && (
                    <button
                        onClick={onUploadClick}
                        className="inline-flex items-center gap-1 text-xs bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-400 transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        Upload
                    </button>
                )}
            </div>

            {images.length > 0 ? (
                <>
                    {/* Main large image display */}
                    <div className="relative mb-4">
                        {/* Navigation buttons */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                    title="Previous image"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                    title="Next image"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* Large image */}
                        <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden cursor-pointer" onClick={openFullResolution}>
                            <img
                                src={getApiUrl(`/media/${images[currentImageIndex].id}/image`)}
                                alt={images[currentImageIndex].original_filename}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA4IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkg5QzEwLjEgMiAxMSAyLjkgMTEgNFYxNkgxMkMxMy4xIDE2IDE0IDE1LjEgMTQgMTNIMTZWMTRIMThDMjAuMSAxMiAyMiAxMC4xIDIyIDhWNUMyMiAzLjkgMjAuMSAyIDE4IDJIMTJ6IiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                                }}
                            />
                        </div>

                        {/* Image info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center justify-between text-white">
                                <div>
                                    <h3 className="font-medium text-sm">
                                        {images[currentImageIndex].original_filename}
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-1">
                                        Uploaded by {images[currentImageIndex].uploaded_by} • {new Date(images[currentImageIndex].uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {currentImageIndex + 1} of {images.length}
                                </div>
                            </div>
                        </div>

                        {/* Remove button for editors */}
                        {canEdit && (
                            <button
                                onClick={() => onRemoveImage(images[currentImageIndex].id)}
                                className="absolute top-2 right-2 z-10 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
                                title="Remove image"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Thumbnail navigation */}
                    {images.length > 1 && (
                        <div
                            className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgb(71 85 105) rgb(30 41 59 / 0.5)'
                            }}
                        >
                            {images.map((image, index) => (
                                <button
                                    key={image.id}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                                        index === currentImageIndex
                                            ? 'border-teal-400 ring-2 ring-teal-400/20'
                                            : 'border-slate-600 hover:border-slate-400'
                                    }`}
                                    title={image.original_filename}
                                >
                                    <img
                                        src={getApiUrl(`/media/${image.id}/image`)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA4IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkg5QzEwLjEgMiAxMSAyLjkgMTEgNFYxNkgxMkMxMy4xIDE2IDE0IDE1LjEgMTQgMTNIMTZWMTRIMThDMjAuMSAxMiAyMiAxMC4xIDIyIDhWNUMyMiAzLjkgMjAuMSAyIDE4IDJIMTJ6IiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <PhotoIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">No images attached to this cave</p>
                    {canEdit && (
                        <button
                            onClick={onUploadClick}
                            className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-400 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Upload Images
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Full Resolution Modal */}
        {isFullResolutionOpen && (
            <div
                ref={modalRef}
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
                onClick={closeFullResolution}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {/* Close button */}
                <button
                    onClick={closeFullResolution}
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Navigation buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Full resolution image */}
                <div className="max-w-full max-h-full p-4">
                    <img
                        src={getApiUrl(`/media/${images[currentImageIndex].id}/image`)}
                        alt={images[currentImageIndex].original_filename}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA4IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkg5QzEwLjEgMiAxMSAyLjkgMTEgNFYxNkgxMkMxMy4xIDE2IDE0IDE1LjEgMTQgMTNIMTZWMTRIMThDMjAuMSAxMiAyMiAxMC4xIDIyIDhWNUMyMiAzLjkgMjAuMSAyIDE4IDJIMTJ6IiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                        }}
                    />
                </div>

                {/* Image info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <h3 className="font-medium text-sm">
                                {images[currentImageIndex].original_filename}
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">
                                Uploaded by {images[currentImageIndex].uploaded_by} • {new Date(images[currentImageIndex].uploaded_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-xs text-slate-400">
                            {currentImageIndex + 1} of {images.length}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ImageGallery;
