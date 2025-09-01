import { PhotoIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import PhotoThumbnail from './PhotoThumbnail';
import PropTypes from 'prop-types';

export default function PhotoGallery({ photos = [], onPhotoClick }) {
    if (!photos.length) return null;

    return (
        <InfoCard
            title={
                <>
                    Photo Gallery{' '}
                    <span className="text-lg font-normal text-gray-500 ml-2">({photos.length})</span>
                </>
            }
            icon={<PhotoIcon />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                    <PhotoThumbnail
                        key={index}
                        photo={photo}
                        index={index}
                        onClick={() => onPhotoClick(photo, index)}
                    />
                ))}
            </div>
        </InfoCard>
    );
}

PhotoGallery.propTypes = {
    photos: PropTypes.array.isRequired,
    onPhotoClick: PropTypes.func.isRequired,
};