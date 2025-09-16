import React from 'react';
import Loader from './Loader';

const FullScreenLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col justify-center items-center">
            <Loader />
            <p className="mt-4 text-lg text-gray-400">Yükleniyor...</p>
        </div>
    );
};

export default FullScreenLoader;
