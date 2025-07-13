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
            return <ChevronUpIcon className="w-4 h-4 text-gray-300" />
        }

        return sortConfig.direction === 'asc'
            ? <ChevronUpIcon className="w-4 h-4 text-gray-900" />
            : <ChevronDownIcon className="w-4 h-4 text-gray-900" />
    }

    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Name</span>
                                {getSortIcon('name')}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('zone')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Zone</span>
                                {getSortIcon('zone')}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('code')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Code</span>
                                {getSortIcon('code')}
                            </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GPS N
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GPS E
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('asl')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>ASL</span>
                                {getSortIcon('asl')}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('length')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Length</span>
                                {getSortIcon('length')}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('depth')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Depth</span>
                                {getSortIcon('depth')}
                            </div>
                        </th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCaves.length > 0 ? (
                        sortedCaves.map((cave, index) => (
                            <tr key={cave.id || index} className="hover:bg-gray-50 ">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    <Link to={`/cave/${cave.id}`} className="text-blue-600 hover:underline">
                                        {cave.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.zone}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.code}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.gpsN}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.gpsE}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.asl}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.length}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {cave.depth}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                                No caves found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}


export default CaveTable;