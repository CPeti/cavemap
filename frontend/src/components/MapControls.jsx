import PropTypes from 'prop-types';

export default function MapControls({ mapStyle, onMapStyleChange, is3D, onToggle3D }) {
    return (
        <div className="absolute bottom-6 right-6 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
            <div className="p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Map Style</h3>
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer group">
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/outdoors-v12?optimize=true"
                            checked={mapStyle.includes("outdoors")}
                            onChange={(e) => onMapStyleChange(e.target.value)}
                            className="w-4 h-4 text-teal-500 bg-slate-800 border-slate-600 focus:ring-teal-500 focus:ring-offset-slate-900"
                        />
                        <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors">Outdoors</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/satellite-streets-v12"
                            checked={mapStyle.includes("satellite")}
                            onChange={(e) => onMapStyleChange(e.target.value)}
                            className="w-4 h-4 text-teal-500 bg-slate-800 border-slate-600 focus:ring-teal-500 focus:ring-offset-slate-900"
                        />
                        <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors">Satellite</span>
                    </label>
                </div>

                <div className="border-t border-slate-700 pt-3 mt-3">
                    <label className="flex items-center cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={is3D}
                            onChange={(e) => onToggle3D(e.target.checked)}
                            className="w-4 h-4 text-teal-500 bg-slate-800 border-slate-600 rounded focus:ring-teal-500 focus:ring-offset-slate-900"
                        />
                        <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors font-medium">3D Terrain</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

MapControls.propTypes = {
    mapStyle: PropTypes.string.isRequired,
    onMapStyleChange: PropTypes.func.isRequired,
    is3D: PropTypes.bool.isRequired,
    onToggle3D: PropTypes.func.isRequired,
};
