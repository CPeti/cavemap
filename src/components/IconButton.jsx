import PropTypes from 'prop-types';

export default function IconButton({ onClick, ariaLabel, children, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative rounded-xl bg-gray-50 p-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
        >
            <span className="absolute -inset-1.5" />
            <span className="sr-only">{ariaLabel}</span>
            {children}
        </button>
    )
}

IconButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
