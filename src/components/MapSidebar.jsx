import { useNavigate } from "react-router-dom";
import CaveMeasurementCards from './CaveMeasurementCards';
import SidebarLocationSection from './SidebarLocationSection';
import SidebarAdditionalInfo from './SidebarAdditionalInfo';
import PropTypes from 'prop-types';

export default function MapSidebar({ selectedCave, isOpen, onClose }) {
    const navigate = useNavigate();

    if (!selectedCave) return null;

    return (
        <>
            {/* Backdrop for mobile when sidebar is open */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar backdrop"
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
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

                        {/* Description */}
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

                {/* Footer Actions - Fixed at bottom */}
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
                            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open in Google Maps
                        </button>
                    </div>
                </div>
            </div>
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
