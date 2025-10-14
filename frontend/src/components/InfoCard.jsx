import PropTypes from 'prop-types';

export default function InfoCard({ title, icon, iconBgColor = "bg-blue-100", iconColor = "text-blue-600", children }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center mb-6">
                <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center mr-4`}>
                    <div className={`w-6 h-6 ${iconColor}`}>
                        {icon}
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            {children}
        </div>
    );
}

InfoCard.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    iconBgColor: PropTypes.string,
    iconColor: PropTypes.string,
    children: PropTypes.node.isRequired,
};
