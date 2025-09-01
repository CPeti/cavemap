import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import DataRow from './DataRow';
import PropTypes from 'prop-types';

export default function DiscoveryInfoCard({ cave }) {
    if (!cave.discoveryDate && !cave.discoveredBy) return null;

    return (
        <InfoCard
            title="Discovery Information"
            icon={<CalendarDaysIcon />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
        >
            <div className="space-y-4">
                <DataRow
                    label="Discovery Date"
                    value={cave.discoveryDate}
                    showBorder={false}
                />
                <DataRow
                    label="Contact for Info"
                    value={cave.discoveredBy}
                />
            </div>
        </InfoCard>
    );
}

DiscoveryInfoCard.propTypes = {
    cave: PropTypes.shape({
        discoveryDate: PropTypes.string,
        discoveredBy: PropTypes.string,
    }).isRequired,
};
