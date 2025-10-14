import PropTypes from 'prop-types';

export default function DataRow({ label, value, showBorder = true, valueClassName = "" }) {
    if (!value && value !== 0) return null;

    return (
        <div className={`flex justify-between items-center py-2 ${showBorder ? 'border-t border-gray-100' : ''}`}>
            <span className="text-gray-600 font-medium">{label}</span>
            <span className={`text-gray-900 font-semibold ${valueClassName}`}>{value}</span>
        </div>
    );
}

DataRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    showBorder: PropTypes.bool,
    valueClassName: PropTypes.string,
};
