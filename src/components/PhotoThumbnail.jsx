import PropTypes from 'prop-types';

export default function PhotoThumbnail({ photo, index, onClick }) {
    return (
        <button
            type="button"
            className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-200 aspect-square shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
            onClick={onClick}
        >
            <img
                src={photo.url}
                alt={photo.caption || photo.filename || `Cave photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                    console.error(`Image ${index} failed to load:`, photo.url);
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.border = '2px solid #ef4444';
                }}
            />
        </button>
    );
}

PhotoThumbnail.propTypes = {
    photo: PropTypes.shape({
        url: PropTypes.string.isRequired,
        caption: PropTypes.string,
        filename: PropTypes.string,
    }).isRequired,
    index: PropTypes.number.isRequired,
    onClick: PropTypes.func,
};