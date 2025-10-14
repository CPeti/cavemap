import { ArrowDownIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import StatDisplay from './StatDisplay';
import PropTypes from 'prop-types';

export default function MeasurementsCard({ cave }) {
    const hasData = (cave.depth != null) || (cave.length != null);

    return (
        <InfoCard
            title="Measurements"
            icon={<ArrowDownIcon />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
        >
            <div className="space-y-4">
                {hasData ? (
                    <>
                        {(cave.depth != null) && (
                            <StatDisplay
                                value={cave.depth}
                                label="meters deep"
                            />
                        )}
                        {(cave.length != null) && (
                            <StatDisplay
                                value={cave.length}
                                label="meters total length"
                                showBorder={cave.depth != null}
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No measurement data available
                    </div>
                )}
            </div>
        </InfoCard>
    );
}

MeasurementsCard.propTypes = {
    cave: PropTypes.shape({
        depth: PropTypes.number,
        length: PropTypes.number,
    }).isRequired,
};