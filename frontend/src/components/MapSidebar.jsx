import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import {
    XMarkIcon,
    MapPinIcon,
    ArrowsPointingOutIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    TagIcon,
    GlobeAltIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const InfoRow = ({ label, value, unit }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm text-slate-300">
            {value ?? "—"}
            {value && unit && <span className="text-slate-500 ml-1">{unit}</span>}
        </span>
    </div>
);

export default function MapSidebar({ selectedCave, isOpen, onClose }) {
    const navigate = useNavigate();
    const sheetRef = useRef(null);
    const contentRef = useRef(null);

    const MIN_HEIGHT = 260;
    const NAVBAR_HEIGHT = 64;
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

    useEffect(() => {
        const maxOpenY = NAVBAR_HEIGHT + TOP_PADDING;
        setIsFullyOpen(translateY <= maxOpenY + 5);
    }, [translateY]);

    const getPointerY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const handleDragStart = (e) => {
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

        newY = Math.max(maxOpenY, Math.min(newY, maxClosedY));
        setTranslateY(newY);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const maxOpenY = NAVBAR_HEIGHT + TOP_PADDING;
        const maxClosedY = window.innerHeight - MIN_HEIGHT;
        const midPoint = (maxOpenY + maxClosedY) / 2;

        if (translateY < midPoint) {
            setTranslateY(maxOpenY);
        } else {
            setTranslateY(maxClosedY);
        }
    };

    const handleContentTouchStart = (e) => {
        if (!isFullyOpen) return;

        const scrollableContent = contentRef.current;
        if (!scrollableContent) return;

        const startY = getPointerY(e);
        const scrollTop = scrollableContent.scrollTop;

        const handleTouchMove = (moveEvent) => {
            const currentY = getPointerY(moveEvent);
            const deltaY = currentY - startY;

            if (scrollTop === 0 && deltaY > 0) {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);

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

    const entrances = selectedCave.entrances || [];
    const primaryEntrance = entrances[0];

    const SidebarContent = () => (
        <div className="space-y-4">
            {/* Measurements */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowsPointingOutIcon className="w-4 h-4 text-teal-400" />
                        <span className="text-xs text-slate-500">Length</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                        {selectedCave.length ?? "—"}
                        {selectedCave.length && <span className="text-sm text-slate-500 ml-1">m</span>}
                    </span>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowTrendingDownIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Depth</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                        {selectedCave.depth ?? "—"}
                        {selectedCave.depth && <span className="text-sm text-slate-500 ml-1">m</span>}
                    </span>
                </div>
            </div>

            {/* Cave Details */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Details</h3>
                <div className="divide-y divide-slate-700/50">
                    <InfoRow label="Zone" value={selectedCave.zone} />
                    <InfoRow label="Code" value={selectedCave.code} />
                    <InfoRow label="Vertical Extent" value={selectedCave.vertical_extent} unit="m" />
                    <InfoRow label="Horizontal Extent" value={selectedCave.horizontal_extent} unit="m" />
                </div>
            </div>

            {/* Survey Info */}
            {(selectedCave.first_surveyed || selectedCave.last_surveyed) && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Survey History
                    </h3>
                    <div className="divide-y divide-slate-700/50">
                        <InfoRow label="First Surveyed" value={selectedCave.first_surveyed} />
                        <InfoRow label="Last Surveyed" value={selectedCave.last_surveyed} />
                    </div>
                </div>
            )}

            {/* Entrances */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Entrances
                    <span className="ml-auto bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">
                        {entrances.length}
                    </span>
                </h3>
                {entrances.length > 0 ? (
                    <div className="space-y-3">
                        {entrances.map((entrance, index) => (
                            <div
                                key={entrance.entrance_id}
                                className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">
                                        {entrance.name || `Entrance ${index + 1}`}
                                    </span>
                                    <a
                                        href={`https://www.google.com/maps?q=${entrance.gps_n},${entrance.gps_e}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-teal-400 hover:text-teal-300"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Open →
                                    </a>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-500 block">Lat</span>
                                        <span className="text-slate-300 font-mono">
                                            {entrance.gps_n?.toFixed(5)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Lng</span>
                                        <span className="text-slate-300 font-mono">
                                            {entrance.gps_e?.toFixed(5)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Alt</span>
                                        <span className="text-slate-300">
                                            {entrance.asl_m ? `${entrance.asl_m}m` : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No entrances recorded</p>
                )}
            </div>
        </div>
    );

    const ActionButtons = ({ isMobile = false }) => (
        <div className={`flex ${isMobile ? 'gap-3' : 'flex-col gap-2'}`}>
            <Link
                to={`/cave/${selectedCave.cave_id}`}
                className={`${isMobile ? 'flex-1' : 'w-full'} bg-teal-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 text-sm`}
            >
                <TagIcon className="w-4 h-4" />
                View Details
            </Link>
            {primaryEntrance && (
                <a
                    href={`https://www.google.com/maps?q=${primaryEntrance.gps_n},${primaryEntrance.gps_e}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${isMobile ? 'flex-1' : 'w-full'} bg-slate-700 text-slate-300 py-2.5 px-4 rounded-lg font-medium hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm`}
                >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Google Maps
                </a>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`
                hidden sm:flex fixed top-16 left-0 bottom-0 bg-slate-900 border-r border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                sm:w-72 md:w-80 lg:w-96
                flex flex-col
                overflow-hidden
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Header */}
                <div className="flex-shrink-0 bg-slate-800 px-5 py-4 border-b border-slate-700">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-3">
                            <h1 className="text-lg font-semibold text-white truncate">
                                {selectedCave.name || "Unknown Cave"}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                {selectedCave.zone && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <GlobeAltIcon className="w-3 h-3" />
                                        {selectedCave.zone}
                                    </span>
                                )}
                                {selectedCave.code && (
                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                                        {selectedCave.code}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            aria-label="Close sidebar"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 hide-scrollbar">
                    <SidebarContent />
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900">
                    <ActionButtons />
                </div>
            </div>

            {/* Mobile Bottom Sheet */}
            {isOpen && (
                <div
                    ref={sheetRef}
                    className="sm:hidden fixed left-0 right-0 bg-slate-900 shadow-2xl z-40 rounded-t-2xl pointer-events-auto flex flex-col border-t border-slate-700"
                    style={{
                        transform: `translateY(${translateY}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                        height: `${window.innerHeight - TOP_PADDING}px`,
                        maxHeight: `${window.innerHeight - TOP_PADDING}px`,
                        bottom: 0,
                    }}
                >
                    {/* Drag Handle */}
                    <div
                        className="drag-handle flex justify-center py-3 cursor-grab active:cursor-grabbing flex-shrink-0"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div
                        className="drag-handle flex-shrink-0 px-5 pb-4 border-b border-slate-800 cursor-grab active:cursor-grabbing"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-3">
                                <h1 className="text-lg font-semibold text-white truncate">
                                    {selectedCave.name || "Unknown Cave"}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedCave.zone && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <GlobeAltIcon className="w-3 h-3" />
                                            {selectedCave.zone}
                                        </span>
                                    )}
                                    {selectedCave.code && (
                                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                            {selectedCave.code}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        ref={contentRef}
                        className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 hide-scrollbar"
                        onTouchStart={handleContentTouchStart}
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'none',
                        }}
                    >
                        <SidebarContent />
                        
                        {/* Action buttons inside scroll area for mobile */}
                        <div className="pt-4 pb-8">
                            <ActionButtons isMobile />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

MapSidebar.propTypes = {
    selectedCave: PropTypes.shape({
        cave_id: PropTypes.number,
        name: PropTypes.string,
        zone: PropTypes.string,
        code: PropTypes.string,
        first_surveyed: PropTypes.string,
        last_surveyed: PropTypes.string,
        length: PropTypes.number,
        depth: PropTypes.number,
        vertical_extent: PropTypes.number,
        horizontal_extent: PropTypes.number,
        entrances: PropTypes.arrayOf(PropTypes.shape({
            entrance_id: PropTypes.number,
            name: PropTypes.string,
            gps_n: PropTypes.number,
            gps_e: PropTypes.number,
            asl_m: PropTypes.number,
        })),
    }),
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
