import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLocation } from 'react-router-dom'

// Import the new components
import Logo from './Logo'
import NavLink from './NavLink'
import IconButton from './IconButton'
import UserAvatar from './UserAvatar'
import UserInfo from './UserInfo'
import MenuItemLink from './MenuItemLink'

export default function Navbar() {
    const location = useLocation()

    const navigation = [
        { name: 'Home', href: '/', current: location.pathname === '/' },
        { name: 'Map', href: '/map', current: location.pathname === '/map' },
        { name: 'Cadaster', href: '/caves', current: location.pathname === '/caves' },
        { name: 'Upload', href: '/upload', current: location.pathname === '/upload' }
    ]

    const userMenuItems = [
        {
            name: 'Your Profile',
            href: '#',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            name: 'Settings',
            href: '#',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {
            name: 'Sign out',
            href: '#',
            variant: 'danger',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            )
        }
    ]

    return (
        <Disclosure as="nav" className="bg-white shadow-lg relative z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        {/* Mobile menu button */}
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all duration-200">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="block w-6 h-6 group-data-open:hidden" />
                            <XMarkIcon aria-hidden="true" className="hidden w-6 h-6 group-data-open:block" />
                        </DisclosureButton>
                    </div>

                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        {/* Logo */}
                        <div className="flex shrink-0 items-center">
                            <Logo />
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-8 sm:block">
                            <div className="flex space-x-2">
                                {navigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        href={item.href}
                                        current={item.current}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        {/* Notifications */}
                        <IconButton ariaLabel="View notifications">
                            <BellIcon aria-hidden="true" className="w-5 h-5" />
                        </IconButton>

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative ml-3">
                            <div>
                                <MenuButton className="relative flex rounded-xl bg-gray-50 p-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </MenuButton>
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
                            >
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">Signed in as</p>
                                    <p className="text-sm text-gray-600 truncate">user@example.com</p>
                                </div>
                                <div className="py-2">
                                    {userMenuItems.map((item) => (
                                        <MenuItem key={item.name}>
                                            <MenuItemLink
                                                href={item.href}
                                                icon={item.icon}
                                                variant={item.variant}
                                            >
                                                {item.name}
                                            </MenuItemLink>
                                        </MenuItem>
                                    ))}
                                </div>
                            </MenuItems>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <DisclosurePanel className="sm:hidden">
                <div className="px-4 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200 shadow-inner">
                    {navigation.map((item) => (
                        <DisclosureButton key={item.name} as="div">
                            <NavLink
                                href={item.href}
                                current={item.current}
                                isMobile={true}
                            >
                                {item.name}
                            </NavLink>
                        </DisclosureButton>
                    ))}

                    {/* Mobile user section */}
                    <div className="pt-4 pb-2 border-t border-gray-200 mt-4">
                        <div className="flex items-center px-4 pb-3">
                            <div className="flex-shrink-0">
                                <UserAvatar showGradient={true} />
                            </div>
                            <div className="ml-3">
                                <UserInfo />
                            </div>
                        </div>
                        <div className="space-y-1">
                            {userMenuItems.map((item) => (
                                <MenuItemLink
                                    key={item.name}
                                    href={item.href}
                                    icon={item.icon}
                                    variant={item.variant}
                                    isMobile={true}
                                >
                                    {item.name}
                                </MenuItemLink>
                            ))}
                        </div>
                    </div>
                </div>
            </DisclosurePanel>
        </Disclosure>
    )
}