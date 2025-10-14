import PropTypes from 'prop-types';

export default function SidebarLocationSection({ cave }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location Details
            </h3>

            <div className="space-y-3">
                {cave.altitude && (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Altitude</span>
                        <span className="text-gray-900 font-semibold">{cave.altitude} m</span>
                    </div>
                )}
                {cave.zone && (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Zone</span>
                        <span className="text-gray-900 font-semibold">{cave.zone}</span>
                    </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Coordinates</div>
                    <div className="font-mono text-sm text-gray-900 bg-gray-50 rounded p-2">
                        {Number(cave.lng).toFixed(5)}, {Number(cave.lat).toFixed(5)}
                    </div>
                </div>
            </div>
        </div>
    );
}

SidebarLocationSection.propTypes = {
    cave: PropTypes.shape({
        altitude: PropTypes.number,
        zone: PropTypes.string,
        lng: PropTypes.number.isRequired,
        lat: PropTypes.number.isRequired,
    }).isRequired,
};
