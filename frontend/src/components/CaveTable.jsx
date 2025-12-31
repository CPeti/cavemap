import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types';

const CaveTable = ({ caves = [] }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'length', direction: 'desc' })

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
            return <ChevronUpIcon className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        }

        return sortConfig.direction === 'asc'
            ? <ChevronUpIcon className="w-4 h-4 text-teal-400" />
            : <ChevronDownIcon className="w-4 h-4 text-teal-400" />
    }

    return (
        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-800 border-b border-slate-700">
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Name</span>
                                    {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('zone')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Zone</span>
                                    {getSortIcon('zone')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('code')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Code</span>
                                    {getSortIcon('code')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('first_surveyed')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>First Surveyed</span>
                                    {getSortIcon('first_surveyed')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('last_surveyed')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Last Surveyed</span>
                                    {getSortIcon('last_surveyed')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('length')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Length</span>
                                    {getSortIcon('length')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('depth')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Depth</span>
                                    {getSortIcon('depth')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('vertical_extent')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Vertical Extent</span>
                                    {getSortIcon('vertical_extent')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="group px-6 py-4 text-left text-sm font-medium text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors duration-150 select-none"
                                onClick={() => handleSort('horizontal_extent')}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Horizontal Extent</span>
                                    {getSortIcon('horizontal_extent')}
                                </div>
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-700/50">
                        {sortedCaves.length > 0 ? (
                            sortedCaves.map((cave, index) => (
                                <tr
                                    key={cave.id || index}
                                    className="hover:bg-slate-800 transition-colors duration-150 group"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/cave/${cave.id}`}
                                            className="text-teal-400 hover:text-teal-300 font-medium text-sm transition-colors duration-150"
                                        >
                                            {cave.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.zone}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                                        {cave.code}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.first_surveyed}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.last_surveyed}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.length}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.depth}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.vertical_extent}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {cave.horizontal_extent}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0v-2a2 2 0 012-2h2a2 2 0 012 2v2M6 11h8" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-300">No caves found</p>
                                            <p className="text-sm text-slate-500">Try adjusting your search criteria</p>
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

CaveTable.propTypes = {
    caves: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            zone: PropTypes.string,
            code: PropTypes.string,
            first_surveyed: PropTypes.string,
            last_surveyed: PropTypes.string,
            length: PropTypes.number,
            depth: PropTypes.number,
            vertical_extent: PropTypes.number,
            horizontal_extent: PropTypes.number,
        })
    ).isRequired,
};
