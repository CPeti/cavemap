import PropTypes from 'prop-types';

export default function LoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-600 font-medium">{message}</div>
            </div>
        </div>
    );
}

LoadingSpinner.propTypes = {
    message: PropTypes.string,
};
