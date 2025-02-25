import { useNavigate } from 'react-router-dom';

const SecuritySettings = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
            </div>
            <div className="m-3">
                <button 
                    className="flex justify-between items-center w-full bg-white p-4 rounded-lg shadow hover:bg-green-50"
                    onClick={() => navigate('/merchant-verify-password')}
                >
                    <span className="text-lg font-semibold text-green-700">Change Password</span>
                </button>
            </div>
        </div>
    );
};

export default SecuritySettings;
