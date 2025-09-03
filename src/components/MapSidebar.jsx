import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import CaveMeasurementCards from './CaveMeasurementCards';
import SidebarLocationSection from './SidebarLocationSection';
import SidebarAdditionalInfo from './SidebarAdditionalInfo';
import PropTypes from 'prop-types';

export default function MapSidebar({ selectedCave, isOpen, onClose }) {
    const navigate = useNavigate();
    const sheetRef = useRef(null);
    const contentRef = useRef(null);

    const MIN_HEIGHT = 236; // visible when opened
    const NAVBAR_HEIGHT = 64; // navbar height in px
    const TOP_PADDING = 10;

    const [translateY, setTranslateY] = useState(window.innerHeight);
    const [isDragging, setIsDragging] = useState(false);
    const [isFullyOpen, setIsFullyOpen] = useState(false);

    const startPointerYRef = useRef(0);
    const startTranslateYRef = useRef(0);

    useEffect(() => {
        if (isOpen) {
            setTranslateY(window.innerHeight - MIN_HEIGHT);
        } else {
            setTranslateY(window.innerHeight);
        }
    }, [isOpen]);

    // Update fully open state
    useEffect(() => {
        const maxOpenY = NAVBAR_HEIGHT + TOP_PADDING;
        setIsFullyOpen(translateY <= maxOpenY + 5); // small tolerance
    }, [translateY]);

    const getPointerY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const handleDragStart = (e) => {
        // Only allow dragging from the handle area
        const dragHandle = e.target.closest('.drag-handle');
        if (!dragHandle) return;

        setIsDragging(true);
        startPointerYRef.current = getPointerY(e);
        startTranslateYRef.current = translateY;
        e.preventDefault();
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();

        const pointerY = getPointerY(e);
        const delta = pointerY - startPointerYRef.current;
        let newY = startTranslateYRef.current + delta;

        const maxOpenY = NAVBAR_HEIGHT + TOP_PADDING;
        const maxClosedY = window.innerHeight - MIN_HEIGHT;

        // Clamp the sheet position
        newY = Math.max(maxOpenY, Math.min(newY, maxClosedY));
        setTranslateY(newY);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Snap to positions
        const maxOpenY = NAVBAR_HEIGHT + TOP_PADDING;
        const maxClosedY = window.innerHeight - MIN_HEIGHT;
        const midPoint = (maxOpenY + maxClosedY) / 2;

        if (translateY < midPoint) {
            // Snap to fully open
            setTranslateY(maxOpenY);
        } else {
            // Snap to minimized
            setTranslateY(maxClosedY);
        }
    };

    // Handle scroll interaction with drag
    const handleContentTouchStart = (e) => {
        if (!isFullyOpen) return;

        const scrollableContent = contentRef.current;
        if (!scrollableContent) return;

        const startY = getPointerY(e);
        const scrollTop = scrollableContent.scrollTop;

        const handleTouchMove = (moveEvent) => {
            const currentY = getPointerY(moveEvent);
            const deltaY = currentY - startY;

            // If scrolled to top and trying to scroll up (drag down), start dragging sheet
            if (scrollTop === 0 && deltaY > 0) {
                // Remove scroll listeners and start sheet drag
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);

                // Start sheet dragging
                setIsDragging(true);
                startPointerYRef.current = currentY;
                startTranslateYRef.current = translateY;
            }
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    useEffect(() => {
        if (!isDragging) return;

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, translateY]);

    if (!selectedCave) return null;

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`
        hidden sm:flex fixed top-16 left-0 bottom-0 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        sm:w-64 md:w-80 lg:w-96
        flex flex-col
        overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Header */}
                <div className="flex-shrink-0 bg-black px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-white truncate pr-4">
                            {selectedCave.name || "Unknown Cave"}
                        </h1>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-2 rounded-full bg-white bg-opacity-20 text-black hover:bg-opacity-30 transition-all duration-200"
                            aria-label="Close sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {selectedCave.code && (
                        <div className="mt-2 inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-sm font-medium text-black">Code: {selectedCave.code}</span>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-6 space-y-4">
                        <CaveMeasurementCards
                            depth={selectedCave.depth}
                            length={selectedCave.length}
                        />
                        <SidebarLocationSection cave={selectedCave} />
                        {selectedCave.description && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {selectedCave.description}
                                </p>
                            </div>
                        )}
                        <SidebarAdditionalInfo cave={selectedCave} />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/cave/${selectedCave.id}`)}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Full Details
                        </button>

                        <button
                            onClick={() => {
                                const googleMapsUrl = `https://maps.google.com/?q=${selectedCave.lat},${selectedCave.lng}`;
                                window.open(googleMapsUrl, '_blank');
                            }}
                            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Open in Google Maps
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Sheet */}
            {isOpen && (
                <div
                    ref={sheetRef}
                    className="sm:hidden fixed left-0 right-0 bg-white shadow-2xl z-40 rounded-t-2xl pointer-events-auto flex flex-col"
                    style={{
                        transform: `translateY(${translateY}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                        height: `${window.innerHeight - (TOP_PADDING)}px`,
                        maxHeight: `${window.innerHeight - (TOP_PADDING)}px`,
                        bottom: 0,
                    }}
                >
                    {/* Drag Handle */}
                    <div
                        className="drag-handle flex justify-center py-3 cursor-grab active:cursor-grabbing flex-shrink-0"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div
                        className="drag-handle flex-shrink-0 px-6 pb-4 border-b border-gray-200 cursor-grab active:cursor-grabbing"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-semibold text-gray-900 truncate">
                                {selectedCave.name || "Unknown Cave"}
                            </h1>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="flex-shrink-0 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 ml-4"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {selectedCave.code && (
                            <div className="mt-2 inline-flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <span className="text-sm font-medium text-gray-700">Code: {selectedCave.code}</span>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Content - properly constrained to viewport */}
                    <div
                        ref={contentRef}
                        className="flex-1 overflow-y-auto overscroll-contain px-6 py-4"
                        onTouchStart={handleContentTouchStart}
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'none',
                            overscrollBehaviorY: 'none',
                            maxHeight: `calc(100vh - ${MIN_HEIGHT}px)`, // Ensure it doesn't exceed viewport
                        }}
                    >
                        <div className="space-y-4">
                            <CaveMeasurementCards depth={selectedCave.depth} length={selectedCave.length} />
                            <SidebarLocationSection cave={selectedCave} />
                            {selectedCave.description && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                    <p className="text-gray-700 leading-relaxed text-sm">{selectedCave.description}</p>
                                </div>
                            )}
                            <SidebarAdditionalInfo cave={selectedCave} />
                            {/* Add some extra content for testing scroll */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3">Additional Information</h3>
                                <p className="text-blue-700 leading-relaxed text-sm">
                                    This is additional content to test the scrolling behavior. When the bottom sheet is fully expanded,
                                    you should be able to scroll through this content smoothly.
                                </p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-green-900 mb-3">More Content</h3>
                                <p className="text-green-700 leading-relaxed text-sm">
                                    Even more content to ensure we have enough to scroll through. The sheet should only be draggable
                                    from the handle at the top, and when fully expanded, dragging down from the top of the content
                                    area should start collapsing the sheet.
                                </p>
                            </div>

                            {/* Buttons inside scrollable area with proper spacing */}
                            <div className="pt-4 pb-8">
                                <div className="flex space-x-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/cave/${selectedCave.id}`);
                                        }}
                                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold active:bg-blue-700 transition-colors duration-200 shadow-lg flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Details
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://maps.google.com/?q=${selectedCave.lat},${selectedCave.lng}`, '_blank');
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium active:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Maps
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

MapSidebar.propTypes = {
    selectedCave: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        code: PropTypes.string,
        depth: PropTypes.number,
        length: PropTypes.number,
        description: PropTypes.string,
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};