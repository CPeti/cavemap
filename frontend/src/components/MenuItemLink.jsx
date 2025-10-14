import PropTypes from 'prop-types';

export default function MenuItemLink({ href, icon, children, variant = "default", isMobile = false }) {
    const variants = {
        default: "text-gray-700 data-focus:bg-gray-50 data-focus:text-gray-900",
        danger: "text-red-700 data-focus:bg-red-50 data-focus:text-red-900"
    }

    const iconVariants = {
        default: "text-gray-500 group-data-focus:text-gray-700",
        danger: "text-red-500 group-data-focus:text-red-700"
    }

    const mobileVariants = {
        default: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        danger: "text-red-700 hover:bg-red-50 hover:text-red-900"
    }

    const mobileIconVariants = {
        default: "text-gray-500",
        danger: "text-red-500"
    }

    if (isMobile) {
        return (
            <a
                href={href}
                className={`flex items-center px-4 py-2 text-base font-medium ${mobileVariants[variant]} rounded-xl transition-colors duration-150`}
            >
                <div className={`w-5 h-5 mr-3 ${mobileIconVariants[variant]}`}>
                    {icon}
                </div>
                {children}
            </a>
        )
    }

    return (
        <a
            href={href}
            className={`group flex items-center px-4 py-2.5 text-sm ${variants[variant]} data-focus:outline-hidden transition-colors duration-150`}
        >
            <div className={`w-4 h-4 mr-3 ${iconVariants[variant]}`}>
                {icon}
            </div>
            {children}
        </a>
    )
}

MenuItemLink.propTypes = {
    href: PropTypes.string.isRequired,
    icon: PropTypes.node,
    children: PropTypes.node,
    variant: PropTypes.oneOf(['default', 'danger']),
    isMobile: PropTypes.bool,
};
