import PropTypes from 'prop-types';

export default function UserInfo({ name = "User Name", email = "user@example.com" }) {
    return (
        <>
            <div className="text-base font-semibold text-gray-900">{name}</div>
            <div className="text-sm text-gray-600">{email}</div>
        </>
    )
}

UserInfo.propTypes = {
    name: PropTypes.string,
    email: PropTypes.string,
};