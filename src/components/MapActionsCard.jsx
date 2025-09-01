import { MapPinIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function MapActionsCard({ cave, onViewOnCaveMap }) {
    if (!cave.lat || !cave.lng) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">View Location</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <a
                    href={`https://maps.google.com/?q=${cave.lat},${cave.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                    <MapPinIcon className="w-5 h-5 mr-3" />
                    Open in Google Maps
                </a>

                <button
                    onClick={onViewOnCaveMap}
                    className="flex-1 inline-flex items-center justify-center px-6 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                    <MapPinIcon className="w-5 h-5 mr-3" />
                    View on Cave Map
                </button>
            </div>
        </div>
    );
}

MapActionsCard.propTypes = {
    cave: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }).isRequired,
    onViewOnCaveMap: PropTypes.func.isRequired,
};