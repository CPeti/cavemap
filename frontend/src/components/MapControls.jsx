import PropTypes from 'prop-types';

export default function MapControls({ mapStyle, onMapStyleChange, is3D, onToggle3D }) {
    return (
        <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-lg z-10 overflow-hidden">
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Style</h3>
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/outdoors-v12?optimize=true"
                            checked={mapStyle.includes("outdoors")}
                            onChange={(e) => onMapStyleChange(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm text-gray-700">Outdoors</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/satellite-streets-v12"
                            checked={mapStyle.includes("satellite")}
                            onChange={(e) => onMapStyleChange(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm text-gray-700">Satellite</span>
                    </label>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={is3D}
                            onChange={(e) => onToggle3D(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 font-medium">3D Terrain</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

MapControls.propTypes = {
    mapStyle: PropTypes.arrayOf(PropTypes.string).isRequired,
    onMapStyleChange: PropTypes.func.isRequired,
    is3D: PropTypes.bool.isRequired,
    onToggle3D: PropTypes.func.isRequired,
};
