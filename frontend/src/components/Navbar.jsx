import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getApiUrl, getOAuthUrl } from '../config'

export default function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userEmail, setUserEmail] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const searchRef = useRef(null)
    const searchTimeoutRef = useRef(null)

    // Check authentication status
    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch(getApiUrl("/users/me"), {
                    credentials: "include"
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setIsLoggedIn(true);
                    setUserEmail(data.email);
                } else if (response.status === 401) {
                    setIsLoggedIn(false);
                    setUserEmail(null);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsLoggedIn(false);
                setUserEmail(null);
            } finally {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, []);

    // Search caves with debounce
    const searchCaves = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                getApiUrl(`/caves/?search=${encodeURIComponent(query)}&limit=8`),
                { credentials: "include" }
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
                setShowSearchDropdown(true);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search handler
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            searchCaves(query);
        }, 300);
    };

    // Handle cave selection from search
    const handleCaveSelect = (caveId) => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        navigate(`/cave/${caveId}`);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigation = [
        { name: 'Home', href: '/', current: location.pathname === '/' },
        { name: 'Map', href: '/map', current: location.pathname === '/map' },
        { name: 'Cadaster', href: '/caves', current: location.pathname === '/caves' },
        { name: 'Upload', href: '/upload', current: location.pathname === '/upload' }
    ]

    const handleSignIn = () => {
        // Redirect to custom login page with current URL as redirect destination
        window.location.href = "/login?rd=" + encodeURIComponent(location.pathname + location.search);
    };

    const handleSignOut = () => {
        window.location.href = getOAuthUrl("/sign_out") + "?rd=" + 
            encodeURIComponent(window.location.origin);
    };

    // Menu items for logged-in users
    const loggedInMenuItems = [
        {
            name: 'Your Profile',
            href: '/profile',
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
            onClick: handleSignOut,
            variant: 'danger',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            )
        }
    ]

    // Menu items for logged-out users
    const loggedOutMenuItems = [
        {
            name: 'Sign in',
            onClick: handleSignIn,
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
            )
        }
    ]

    const userMenuItems = isLoggedIn ? loggedInMenuItems : loggedOutMenuItems;

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

                    {/* Search Bar */}
                    <div className="hidden sm:block flex-1 max-w-md mx-4" ref={searchRef}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <div className="w-4 h-4 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
                                ) : (
                                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-500" />
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowSearchDropdown(true)}
                                placeholder="Search caves..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                            
                            {/* Search Results Dropdown */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                    <div className="py-1 max-h-80 overflow-y-auto">
                                        {searchResults.map((cave) => (
                                            <button
                                                key={cave.cave_id}
                                                onClick={() => handleCaveSelect(cave.cave_id)}
                                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left"
                                            >
                                                <div className="p-1.5 bg-slate-700 rounded-lg mt-0.5">
                                                    <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{cave.name}</p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {cave.zone || 'Unknown zone'}
                                                        {cave.depth && ` · ${cave.depth}m deep`}
                                                        {cave.length && ` · ${cave.length}m long`}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* No results message */}
                            {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                    <div className="px-4 py-6 text-center">
                                        <MagnifyingGlassIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No caves found for "{searchQuery}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center">
                        {/* Notifications - only show when logged in */}
                        {isLoggedIn && (
                            <button className="relative flex rounded-lg bg-slate-800 p-2 sm:p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all duration-200" aria-label="View notifications">
                                <span className="absolute -inset-1.5" />
                                <BellIcon aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}

                        {/* Profile dropdown / Sign in button */}
                        <Menu as="div" className="relative ml-3">
                            <div>
                                <MenuButton className="relative flex rounded-lg bg-slate-800 p-2 sm:p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    {isLoading ? (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </MenuButton>
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-xl bg-slate-800 py-2 shadow-xl ring-1 ring-slate-700 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
                            >
                                {/* Header - different for logged in/out */}
                                {isLoggedIn ? (
                                    <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700">
                                        <p className="text-xs sm:text-sm font-semibold text-white">Signed in as</p>
                                        <p className="text-xs sm:text-sm text-slate-400 truncate">{userEmail}</p>
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700">
                                        <p className="text-xs sm:text-sm font-semibold text-white">Welcome</p>
                                        <p className="text-xs sm:text-sm text-slate-400">Sign in to access all features</p>
                                    </div>
                                )}
                                <div className="py-2">
                                    {userMenuItems.map((item) => (
                                        <MenuItem key={item.name}>
                                            {({ focus }) => (
                                                item.onClick ? (
                                                    <button
                                                        onClick={item.onClick}
                                                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors w-full text-left ${
                                                            item.variant === 'danger'
                                                                ? focus ? 'bg-red-500/10 text-red-400' : 'text-red-400'
                                                                : focus ? 'bg-slate-700 text-white' : 'text-slate-300'
                                                        }`}
                                                    >
                                                        <span className="w-5 h-5">{item.icon}</span>
                                                        {item.name}
                                                    </button>
                                                ) : (
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
                                                )
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
                    {/* Mobile Search Bar */}
                    <div className="relative mb-3" ref={searchRef}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearching ? (
                                <div className="w-4 h-4 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
                            ) : (
                                <MagnifyingGlassIcon className="h-4 w-4 text-slate-500" />
                            )}
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowSearchDropdown(true)}
                            placeholder="Search caves..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        
                        {/* Mobile Search Results Dropdown */}
                        {showSearchDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                <div className="py-1 max-h-64 overflow-y-auto">
                                    {searchResults.map((cave) => (
                                        <DisclosureButton
                                            key={cave.cave_id}
                                            as="button"
                                            onClick={() => handleCaveSelect(cave.cave_id)}
                                            className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left"
                                        >
                                            <div className="p-1.5 bg-slate-700 rounded-lg mt-0.5">
                                                <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{cave.name}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {cave.zone || 'Unknown zone'}
                                                    {cave.depth && ` · ${cave.depth}m`}
                                                </p>
                                            </div>
                                        </DisclosureButton>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Mobile No results */}
                        {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                <div className="px-4 py-4 text-center">
                                    <p className="text-sm text-slate-500">No caves found</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
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
                    
                    {/* Mobile auth action */}
                    <div className="pt-2 border-t border-slate-800 mt-2">
                        {isLoggedIn ? (
                            <DisclosureButton
                                as="button"
                                onClick={handleSignOut}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                            </DisclosureButton>
                        ) : (
                            <DisclosureButton
                                as="button"
                                onClick={handleSignIn}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-base font-medium text-teal-400 hover:bg-teal-500/10 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Sign in
                            </DisclosureButton>
                        )}
                    </div>
                </div>
            </DisclosurePanel>
        </Disclosure>
    )
}
