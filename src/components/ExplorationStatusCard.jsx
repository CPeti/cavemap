import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import DataRow from './DataRow';
import PropTypes from 'prop-types';

export default function ExplorationStatusCard({ cave }) {
    if (!cave.explorationStatus && !cave.lastSurveyed) return null;

    return (
        <InfoCard
            title="Exploration Status"
            icon={<DocumentMagnifyingGlassIcon />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
        >
            <div className="space-y-4">
                <DataRow
                    label="Mapping Status"
                    value={cave.explorationStatus}
                    showBorder={false}
                />
                <DataRow
                    label="Last Surveyed"
                    value={cave.lastSurveyed}
                />
            </div>
        </InfoCard>
    );
}

ExplorationStatusCard.propTypes = {
    cave: PropTypes.shape({
        explorationStatus: PropTypes.string,
        lastSurveyed: PropTypes.string,
    }).isRequired,
};
