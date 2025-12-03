import React, { useState, useCallback } from 'react';

// Coordinate format patterns
const COORDINATE_PATTERNS = {
    // Decimal degrees: 45.1234, -45.1234
    DECIMAL_DEGREES: /^-?\d{1,3}(\.\d+)?$/,

    // Degrees decimal minutes: 45° 7.404', 45° 7.404' N
    DDM: /^(\d{1,3})°?\s*(\d{1,2}(\.\d+)?)'?\s*([NSWE])?$/i,

    // Degrees minutes seconds: 45° 7' 24.24", 45° 7' 24.24" N
    DMS: /^(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}(\.\d+)?)"?\s*([NSWE])?$/i,

    // Google Maps format: 45.123456, 14.567890
    GOOGLE_MAPS: /^(-?\d{1,3}\.\d{4,}),?\s*(-?\d{1,3}\.\d{4,})$/,

    // UTM: 33T 123456 5678901 (simplified - only recognizes basic format)
    UTM: /^(\d{1,2}[A-Z])\s+(\d{6})\s+(\d{7})$/i,

    // MGRS: 33T TK 12345 67890 (simplified)
    MGRS: /^(\d{1,2}[A-Z])\s+([A-Z]{2})\s+(\d{5})\s+(\d{5})$/i,
};

// Coordinate format names
const FORMAT_NAMES = {
    DECIMAL_DEGREES: 'Decimal Degrees',
    DDM: 'Degrees Decimal Minutes',
    DMS: 'Degrees Minutes Seconds',
    GOOGLE_MAPS: 'Google Maps',
    UTM: 'UTM',
    MGRS: 'MGRS',
};

// Convert coordinates to decimal degrees
const convertToDecimalDegrees = (value, format, type) => {
    if (!value || !format) return null;

    try {
        const cleanValue = value.trim();

        switch (format) {
            case 'DECIMAL_DEGREES':
                const dd = parseFloat(cleanValue);
                if (isNaN(dd) || Math.abs(dd) > 180) return null;
                // For longitude, check range
                if (type === 'longitude' && Math.abs(dd) > 180) return null;
                // For latitude, check range
                if (type === 'latitude' && Math.abs(dd) > 90) return null;
                return dd;

            case 'DDM':
                const ddmMatch = cleanValue.match(/^(\d{1,3})°?\s*(\d{1,2}(\.\d+)?)'?\s*([NSWE])?$/i);
                if (!ddmMatch) return null;

                let [, ddmDegrees, ddmMinutes, , ddmHemisphere] = ddmMatch;
                ddmDegrees = parseInt(ddmDegrees);
                ddmMinutes = parseFloat(ddmMinutes);

                if (ddmDegrees < 0 || ddmDegrees > 180 || ddmMinutes < 0 || ddmMinutes >= 60) return null;

                let ddmDecimal = ddmDegrees + ddmMinutes / 60;

                // Apply hemisphere
                if (ddmHemisphere) {
                    ddmHemisphere = ddmHemisphere.toUpperCase();
                    if ((type === 'latitude' && ddmHemisphere === 'S') || (type === 'longitude' && ddmHemisphere === 'W')) {
                        ddmDecimal = -ddmDecimal;
                    }
                }

                // Validate ranges
                if (type === 'latitude' && Math.abs(ddmDecimal) > 90) return null;
                if (type === 'longitude' && Math.abs(ddmDecimal) > 180) return null;

                return ddmDecimal;

            case 'DMS':
                const dmsMatch = cleanValue.match(/^(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}(\.\d+)?)"?\s*([NSWE])?$/i);
                if (!dmsMatch) return null;

                let [, dmsDegrees, dmsMinutes, dmsSeconds, , dmsHemisphere] = dmsMatch;
                dmsDegrees = parseInt(dmsDegrees);
                dmsMinutes = parseInt(dmsMinutes);
                dmsSeconds = parseFloat(dmsSeconds);

                if (dmsDegrees < 0 || dmsDegrees > 180 || dmsMinutes < 0 || dmsMinutes >= 60 || dmsSeconds < 0 || dmsSeconds >= 60) return null;

                let dmsDecimal = dmsDegrees + dmsMinutes / 60 + dmsSeconds / 3600;

                // Apply hemisphere
                if (dmsHemisphere) {
                    dmsHemisphere = dmsHemisphere.toUpperCase();
                    if ((type === 'latitude' && dmsHemisphere === 'S') || (type === 'longitude' && dmsHemisphere === 'W')) {
                        dmsDecimal = -dmsDecimal;
                    }
                }

                // Validate ranges
                if (type === 'latitude' && Math.abs(dmsDecimal) > 90) return null;
                if (type === 'longitude' && Math.abs(dmsDecimal) > 180) return null;

                return dmsDecimal;

            case 'GOOGLE_MAPS':
                const googleMatch = cleanValue.match(/^(-?\d{1,3}\.\d{4,}),?\s*(-?\d{1,3}\.\d{4,})$/);
                if (!googleMatch) return null;

                const lat = parseFloat(googleMatch[1]);
                const lng = parseFloat(googleMatch[2]);

                if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

                return type === 'latitude' ? lat : lng;

            default:
                return null;
        }
    } catch (error) {
        return null;
    }
};

// Detect coordinate format from input
const detectCoordinateFormat = (value) => {
    if (!value || typeof value !== 'string') return null;

    const cleanValue = value.trim();

    // Check each pattern
    for (const [format, pattern] of Object.entries(COORDINATE_PATTERNS)) {
        if (pattern.test(cleanValue)) {
            return format;
        }
    }

    return null;
};

export default function CoordinateInput({
    label,
    latitude,
    longitude,
    onChange,
    required = false,
    className = ""
}) {
    const [latFormat, setLatFormat] = useState('DECIMAL_DEGREES');
    const [lngFormat, setLngFormat] = useState('DECIMAL_DEGREES');
    const [latInput, setLatInput] = useState(latitude || '');
    const [lngInput, setLngInput] = useState(longitude || '');
    const [latError, setLatError] = useState('');
    const [lngError, setLngError] = useState('');

    // Update inputs when props change
    React.useEffect(() => {
        setLatInput(latitude || '');
        setLngInput(longitude || '');
    }, [latitude, longitude]);

    // Handle latitude input change
    const handleLatInputChange = useCallback((e) => {
        const value = e.target.value;
        setLatInput(value);

        // Auto-detect format
        const detectedFormat = detectCoordinateFormat(value);
        if (detectedFormat) {
            setLatFormat(detectedFormat);
        }

        // Convert and validate
        const decimalValue = convertToDecimalDegrees(value, detectedFormat || latFormat, 'latitude');
        if (decimalValue !== null) {
            setLatError('');
            onChange('latitude', decimalValue);
        } else if (value && detectedFormat) {
            setLatError('Invalid latitude format');
        } else if (value) {
            setLatError('Please select correct format');
        } else {
            setLatError('');
            onChange('latitude', null);
        }
    }, [latFormat, onChange]);

    // Handle longitude input change
    const handleLngInputChange = useCallback((e) => {
        const value = e.target.value;
        setLngInput(value);

        // Auto-detect format
        const detectedFormat = detectCoordinateFormat(value);
        if (detectedFormat) {
            setLngFormat(detectedFormat);
        }

        // Convert and validate
        const decimalValue = convertToDecimalDegrees(value, detectedFormat || lngFormat, 'longitude');
        if (decimalValue !== null) {
            setLngError('');
            onChange('longitude', decimalValue);
        } else if (value && detectedFormat) {
            setLngError('Invalid longitude format');
        } else if (value) {
            setLngError('Please select correct format');
        } else {
            setLngError('');
            onChange('longitude', null);
        }
    }, [lngFormat, onChange]);

    // Handle format change
    const handleLatFormatChange = (format) => {
        setLatFormat(format);
        // Re-validate with new format
        const decimalValue = convertToDecimalDegrees(latInput, format, 'latitude');
        if (decimalValue !== null) {
            setLatError('');
            onChange('latitude', decimalValue);
        } else if (latInput) {
            setLatError('Invalid format');
        }
    };

    const handleLngFormatChange = (format) => {
        setLngFormat(format);
        // Re-validate with new format
        const decimalValue = convertToDecimalDegrees(lngInput, format, 'longitude');
        if (decimalValue !== null) {
            setLngError('');
            onChange('longitude', decimalValue);
        } else if (lngInput) {
            setLngError('Invalid format');
        }
    };

    // Handle paste event to auto-detect format
    const handlePaste = useCallback((e, type) => {
        const pastedText = e.clipboardData.getData('text');
        const detectedFormat = detectCoordinateFormat(pastedText);

        if (detectedFormat === 'GOOGLE_MAPS') {
            e.preventDefault();
            const match = pastedText.match(/^(-?\d{1,3}\.\d{4,}),?\s*(-?\d{1,3}\.\d{4,})$/);
            if (match) {
                const lat = match[1];
                const lng = match[2];
                setLatInput(lat);
                setLngInput(lng);
                setLatFormat('DECIMAL_DEGREES');
                setLngFormat('DECIMAL_DEGREES');

                onChange('latitude', parseFloat(lat));
                onChange('longitude', parseFloat(lng));
                setLatError('');
                setLngError('');
            }
        } else if (detectedFormat) {
            // For single coordinate formats, just set the format
            if (type === 'latitude') {
                setLatFormat(detectedFormat);
            } else {
                setLngFormat(detectedFormat);
            }
        }
    }, [onChange]);

    return (
        <div className={`grid grid-cols-1 gap-3 ${className}`}>
            {/* Latitude */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Latitude {required && <span className="text-red-400">*</span>}
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={latInput}
                            onChange={handleLatInputChange}
                            onPaste={(e) => handlePaste(e, 'latitude')}
                            placeholder="45.1234"
                            className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                                latError ? 'border-red-500' : 'border-slate-700'
                            }`}
                        />
                        {latError && (
                            <div className="absolute -bottom-5 left-0 text-xs text-red-400">
                                {latError}
                            </div>
                        )}
                    </div>
                    <select
                        value={latFormat}
                        onChange={(e) => handleLatFormatChange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[120px]"
                    >
                        {Object.entries(FORMAT_NAMES).map(([key, name]) => (
                            <option key={key} value={key} className="bg-slate-800">
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Longitude */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Longitude {required && <span className="text-red-400">*</span>}
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={lngInput}
                            onChange={handleLngInputChange}
                            onPaste={(e) => handlePaste(e, 'longitude')}
                            placeholder="14.5678"
                            className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                                lngError ? 'border-red-500' : 'border-slate-700'
                            }`}
                        />
                        {lngError && (
                            <div className="absolute -bottom-5 left-0 text-xs text-red-400">
                                {lngError}
                            </div>
                        )}
                    </div>
                    <select
                        value={lngFormat}
                        onChange={(e) => handleLngFormatChange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[120px]"
                    >
                        {Object.entries(FORMAT_NAMES).map(([key, name]) => (
                            <option key={key} value={key} className="bg-slate-800">
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

