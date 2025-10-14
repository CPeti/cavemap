import PropTypes from 'prop-types';

export default function StatDisplay({ value, label, showBorder = false }) {
    return (
        <div className={`text-center py-4 ${showBorder ? 'border-t border-gray-100' : ''}`}>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-gray-600 font-medium">{label}</div>
        </div>
    );
}

StatDisplay.propTypes = {
    value: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    showBorder: PropTypes.bool,
};