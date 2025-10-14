import PropTypes from 'prop-types';

export default function CaveMeasurementCards({ depth, length }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Depth Card */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {depth || "N/A"}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                    {depth ? "meters deep" : "Depth"}
                </div>
            </div>

            {/* Length Card */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {length || "N/A"}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                    {length ? "meters long" : "Length"}
                </div>
            </div>
        </div>
    );
}

CaveMeasurementCards.propTypes = {
    depth: PropTypes.number,
    length: PropTypes.number,
};
