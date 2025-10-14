import PropTypes from 'prop-types';

export default function UserAvatar({ size = "md", showGradient = false }) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    }

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    }

    const bgClass = showGradient
        ? "bg-gradient-to-br from-gray-400 to-gray-600"
        : "bg-gray-400"

    return (
        <div className={`${sizeClasses[size]} ${bgClass} rounded-full flex items-center justify-center`}>
            <svg className={`${iconSizes[size]} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
    )
}

UserAvatar.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    showGradient: PropTypes.bool,
};
