import { MapPinIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import DataRow from './DataRow';
import PropTypes from 'prop-types';

export default function LocationInfoCard({ cave }) {
    return (
        <InfoCard
            title="Location"
            icon={<MapPinIcon />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
        >
            <div className="space-y-4">
                <DataRow
                    label="Zone"
                    value={cave.zone}
                    showBorder={false}
                />
                <DataRow
                    label="GPS North"
                    value={cave.lat ? cave.lat.toFixed(6) : null}
                    valueClassName="font-mono text-sm"
                />
                <DataRow
                    label="GPS East"
                    value={cave.lng ? cave.lng.toFixed(6) : null}
                    valueClassName="font-mono text-sm"
                />
                <DataRow
                    label="Altitude ASL"
                    value={cave.altitude ? `${cave.altitude} m` : null}
                />
            </div>
        </InfoCard>
    );
}

LocationInfoCard.propTypes = {
    cave: PropTypes.shape({
        zone: PropTypes.string,
        lat: PropTypes.number,
        lng: PropTypes.number,
        altitude: PropTypes.number,
    }).isRequired,
};
