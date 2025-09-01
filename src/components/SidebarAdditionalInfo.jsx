import PropTypes from 'prop-types';

export default function SidebarAdditionalInfo({ cave }) {
    const hasAdditionalInfo = cave.discoveryDate || cave.discoveredBy || cave.explorationStatus;

    if (!hasAdditionalInfo) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
            <div className="space-y-2">
                {cave.discoveryDate && (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Discovered</span>
                        <span className="text-gray-900 font-semibold">{cave.discoveryDate}</span>
                    </div>
                )}
                {cave.discoveredBy && (
                    <div className="py-1">
                        <span className="text-gray-600 font-medium block mb-1">Contact</span>
                        <span className="text-gray-900 text-sm">{cave.discoveredBy}</span>
                    </div>
                )}
                {cave.explorationStatus && (
                    <div className="py-1">
                        <span className="text-gray-600 font-medium block mb-1">Status</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cave.explorationStatus}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

SidebarAdditionalInfo.propTypes = {
    cave: PropTypes.shape({
        discoveryDate: PropTypes.string,
        discoveredBy: PropTypes.string,
        explorationStatus: PropTypes.string,
    }).isRequired,
};
