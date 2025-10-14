import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function CaveHeader({ cave, onBack }) {
    return (
        <div className="relative">
            <div className="h-64 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-16">
                    <button
                        onClick={onBack}
                        className="mb-8 inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm text-black px-4 py-2 rounded-full font-medium hover:bg-opacity-30 transition-all duration-200 shadow-lg"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Back to Database
                    </button>

                    <div className="text-white">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3">
                            {cave.name || "Unknown Cave"}
                        </h1>
                        {cave.code && (
                            <div className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
                                <span className="text-lg font-medium text-black">Code: {cave.code}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

CaveHeader.propTypes = {
    cave: PropTypes.shape({
        name: PropTypes.string,
        code: PropTypes.string,
    }).isRequired,
    onBack: PropTypes.func.isRequired,
};
