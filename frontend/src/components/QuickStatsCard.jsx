import { PhotoIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import DataRow from './DataRow';
import PropTypes from 'prop-types';

export default function QuickStatsCard({ cave, photoCount }) {
    return (
        <InfoCard
            title="Quick Stats"
            icon={<PhotoIcon />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
        >
            <div className="space-y-4">
                <div className="text-center py-2">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{photoCount}</div>
                    <div className="text-gray-600 font-medium">Photos</div>
                </div>

                <DataRow
                    label="Discovered"
                    value={cave.discoveryDate}
                />

                <DataRow
                    label="Mapping Status"
                    value={cave.explorationStatus}
                />
            </div>
        </InfoCard>
    );
}

QuickStatsCard.propTypes = {
    cave: PropTypes.shape({
        discoveryDate: PropTypes.string.isRequired,
        explorationStatus: PropTypes.string.isRequired,
    }).isRequired,
    photoCount: PropTypes.number.isRequired,
};