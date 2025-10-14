import { PhotoIcon } from '@heroicons/react/24/outline';
import InfoCard from './InfoCard';
import PhotoThumbnail from './PhotoThumbnail';
import PropTypes from 'prop-types';

export default function PhotoGallery({ photos, onPhotoClick }) {
    // More robust validation
    const validPhotos = Array.isArray(photos) ? photos : [];
    
    if (validPhotos.length === 0) return null;


    return (
        <InfoCard
            title={
                <>
                    Photo Gallery{' '}
                    <span className="text-lg font-normal text-gray-500 ml-2">({validPhotos.length})</span>
                </>
            }
            icon={<PhotoIcon />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {validPhotos.map((photo, index) => {
                    // Additional validation for each photo
                    if (!photo || !photo.url) {
                        console.warn('Invalid photo object at index', index, ':', photo);
                        return null;
                    }
                    
                    return (
                        <PhotoThumbnail
                            key={photo.storageRef || photo.url || index}
                            photo={photo}
                            index={index}
                            onClick={() => onPhotoClick(photo, index)}
                        />
                    );
                })}
            </div>
        </InfoCard>
    );
}

PhotoGallery.propTypes = {
    photos: PropTypes.arrayOf(PropTypes.shape({
        url: PropTypes.string.isRequired,
        filename: PropTypes.string,
        storageRef: PropTypes.string,
        fileSize: PropTypes.number,
        caption: PropTypes.string,
        photographer: PropTypes.string,
    })),
    onPhotoClick: PropTypes.func.isRequired,
};