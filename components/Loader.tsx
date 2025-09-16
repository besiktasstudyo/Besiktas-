
import React from 'react';

const Loader: React.FC = () => {
    return (
        <div 
            className="w-12 h-12 border-4 border-solid border-gray-600 border-t-cyan-400 rounded-full animate-spin"
            role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
    );
};

export default Loader;
