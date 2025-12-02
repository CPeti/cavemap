import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLocation } from 'react-router-dom'

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
        <Disclosure as="nav" className="bg-slate-900 border-b border-slate-800 fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    {/* Mobile: Left side with hamburger menu and logo */}
                    <div className="flex items-center sm:flex-1 sm:items-stretch sm:justify-start">
                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-lg p-1.5 sm:p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all duration-200">
                                <span className="absolute -inset-0.5" />
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon aria-hidden="true" className="block w-5 h-5 sm:w-6 sm:h-6 group-data-open:hidden" />
                                <XMarkIcon aria-hidden="true" className="hidden w-5 h-5 sm:w-6 sm:h-6 group-data-open:block" />
                            </DisclosureButton>
                        </div>

                        {/* Logo - positioned right after hamburger on mobile, normal position on desktop */}
                        <div className="flex shrink-0 items-center ml-2 sm:ml-0">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-teal-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-lg sm:text-xl font-semibold text-white">CaveDB</h1>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-8 sm:block">
                            <div className="flex space-x-1">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            item.current
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center">
                        {/* Notifications */}
                        <button className="relative flex rounded-lg bg-slate-800 p-2 sm:p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all duration-200" aria-label="View notifications">
                            <span className="absolute -inset-1.5" />
                            <BellIcon aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative ml-3">
                            <div>
                                <MenuButton className="relative flex rounded-lg bg-slate-800 p-2 sm:p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </MenuButton>
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-xl bg-slate-800 py-2 shadow-xl ring-1 ring-slate-700 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
                            >
                                <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700">
                                    <p className="text-xs sm:text-sm font-semibold text-white">Signed in as</p>
                                    <p className="text-xs sm:text-sm text-slate-400 truncate">user@example.com</p>
                                </div>
                                <div className="py-2">
                                    {userMenuItems.map((item) => (
                                        <MenuItem key={item.name}>
                                            {({ focus }) => (
                                                <a
                                                    href={item.href}
                                                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                                        item.variant === 'danger'
                                                            ? focus ? 'bg-red-500/10 text-red-400' : 'text-red-400'
                                                            : focus ? 'bg-slate-700 text-white' : 'text-slate-300'
                                                    }`}
                                                >
                                                    <span className="w-5 h-5">{item.icon}</span>
                                                    {item.name}
                                                </a>
                                            )}
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
                <div className="px-4 pt-2 pb-3 space-y-1 bg-slate-900 border-t border-slate-800">
                    {navigation.map((item) => (
                        <DisclosureButton
                            key={item.name}
                            as="a"
                            href={item.href}
                            className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                                item.current
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
            </DisclosurePanel>
        </Disclosure>
    )
}
