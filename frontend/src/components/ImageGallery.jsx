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
    const [loadingStates, setLoadingStates] = useState({});
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

    const handleImageLoad = (imageId) => {
        setLoadingStates(prev => ({ ...prev, [imageId]: false }));
    };

    const handleImageLoadStart = (imageId) => {
        setLoadingStates(prev => ({ ...prev, [imageId]: true }));
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
                        <div className="relative bg-slate-700 rounded-lg overflow-hidden cursor-pointer max-h-96 flex items-center justify-center min-h-[200px]" onClick={openFullResolution}>
                            {loadingStates[images[currentImageIndex].id] && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                                </div>
                            )}
                            <img
                                key={images[currentImageIndex].id}
                                src={getApiUrl(`/media/${images[currentImageIndex].id}/image`)}
                                alt={images[currentImageIndex].original_filename}
                                className={`max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-200 ${loadingStates[images[currentImageIndex].id] ? 'opacity-0' : 'opacity-100'}`}
                                style={{ maxHeight: '384px' }}
                                loading="lazy"
                                onLoadStart={() => handleImageLoadStart(images[currentImageIndex].id)}
                                onLoad={() => handleImageLoad(images[currentImageIndex].id)}
                                onError={(e) => {
                                    handleImageLoad(images[currentImageIndex].id);
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

                        {/* Action buttons for editors */}
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <a
                                href={getApiUrl(`/media/${images[currentImageIndex].id}/download`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-600/80 hover:bg-slate-500 text-white p-2 rounded-full transition-colors"
                                title="Download image"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </a>
                            {canEdit && (
                                <button
                                    onClick={() => onRemoveImage(images[currentImageIndex].id)}
                                    className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
                                    title="Remove image"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
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
                                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all relative ${
                                        index === currentImageIndex
                                            ? 'border-teal-400 ring-2 ring-teal-400/20'
                                            : 'border-slate-600 hover:border-slate-400'
                                    }`}
                                    title={image.original_filename}
                                >
                                    {loadingStates[image.id] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                                        </div>
                                    )}
                                    <img
                                        src={getApiUrl(`/media/${image.id}/image`)}
                                        alt=""
                                        className={`w-full h-full object-cover transition-opacity duration-200 ${loadingStates[image.id] ? 'opacity-0' : 'opacity-100'}`}
                                        loading="lazy"
                                        onLoadStart={() => handleImageLoadStart(image.id)}
                                        onLoad={() => handleImageLoad(image.id)}
                                        onError={(e) => {
                                            handleImageLoad(image.id);
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
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
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
                <div className="flex-1 p-4 flex items-center justify-center min-h-0 overflow-hidden">
                    {loadingStates[`modal-${images[currentImageIndex].id}`] && (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
                        </div>
                    )}
                    <img
                        key={`modal-${images[currentImageIndex].id}`}
                        src={getApiUrl(`/media/${images[currentImageIndex].id}/image`)}
                        alt={images[currentImageIndex].original_filename}
                        className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-200 ${loadingStates[`modal-${images[currentImageIndex].id}`] ? 'opacity-0' : 'opacity-100'}`}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: 'calc(100vh - 120px)' // Account for header/footer space
                        }}
                        loading="lazy"
                        onLoadStart={() => handleImageLoadStart(`modal-${images[currentImageIndex].id}`)}
                        onLoad={() => handleImageLoad(`modal-${images[currentImageIndex].id}`)}
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => {
                            handleImageLoad(`modal-${images[currentImageIndex].id}`);
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
