import PropTypes from 'prop-types';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function NavLink({ href, current, children, isMobile = false, onClick }) {
    const baseClasses = current
        ? 'bg-blue-50 text-blue-700 shadow-sm'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'

    if (isMobile) {
        const mobileClasses = current
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'

        return (
            <a
                href={href}
                aria-current={current ? 'page' : undefined}
                onClick={onClick}
                className={classNames(
                    mobileClasses,
                    'block rounded-r-xl px-4 py-3 text-base font-semibold transition-all duration-200'
                )}
            >
                {children}
            </a>
        )
    }

    return (
        <a
            href={href}
            aria-current={current ? 'page' : undefined}
            className={classNames(
                baseClasses,
                current ? 'border border-blue-200' : 'border border-transparent',
                'rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-sm'
            )}
        >
            {children}
        </a>
    )
}

NavLink.propTypes = {
    href: PropTypes.string.isRequired,
    current: PropTypes.bool,
    children: PropTypes.node,
    isMobile: PropTypes.bool,
    onClick: PropTypes.func,
};