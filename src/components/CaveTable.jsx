import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const CaveTable = ({ caves = [] }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

    const sortedCaves = [...caves].sort((a, b) => {
        if (!sortConfig.key) return 0

        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }

        if (sortConfig.direction === 'asc') {
            return aValue > bValue ? 1 : -1
        } else {
            return aValue < bValue ? 1 : -1
        }
    })

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUpIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        }

        return sortConfig.direction === 'asc'
            ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
            : <ChevronDownIcon className="w-4 h-4 text-blue-600" />
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            {/* Material Design elevation and rounded corners */}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Name</span>
                                    {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('zone')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Zone</span>
                                    {getSortIcon('zone')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('code')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Code</span>
                                    {getSortIcon('code')}
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                GPS N
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                GPS E
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('asl')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>ASL</span>
                                    {getSortIcon('asl')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('length')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Length</span>
                                    {getSortIcon('length')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none"
                                onClick={() => handleSort('depth')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Depth</span>
                                    {getSortIcon('depth')}
                                </div>
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {sortedCaves.length > 0 ? (
                            sortedCaves.map((cave, index) => (
                                <tr 
                                    key={cave.id || index} 
                                    className="hover:bg-blue-50 transition-colors duration-150 group"
                                >
                                    <td className="px-6 py-4">
                                        <Link 
                                            to={`/cave/${cave.id}`} 
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-150 hover:underline"
                                        >
                                            {cave.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {cave.zone}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                                        {cave.code}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                                        {cave.gpsN}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                                        {cave.gpsE}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {cave.asl}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {cave.length}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {cave.depth}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0v-2a2 2 0 012-2h2a2 2 0 012 2v2M6 11h8" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">No caves found</p>
                                            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CaveTable;