import React from 'react';
import { ExclamationCircleIcon } from './Icons.jsx';

const ErrorDisplay = ({ error }) => (
    <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 mb-8">
        <h3 className="flex items-center text-xl font-bold text-red-300">
            <ExclamationCircleIcon />
            Error Detected in {error.phase}
        </h3>
        <div className="mt-4 space-y-3 font-roboto-mono text-red-200">
            <p><strong className="font-semibold text-red-100">Message:</strong> {error.message}</p>
            <p><strong className="font-semibold text-red-100">Suggestion:</strong> {error.suggestion}</p>
        </div>
    </div>
);

export default ErrorDisplay;