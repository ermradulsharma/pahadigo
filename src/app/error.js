'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service in production
        console.error("Root Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-8">
                        <AlertTriangle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                        We've encountered an unexpected error. Don't worry, our technical team has been notified.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => reset()}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                            Try again
                        </button>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Go back Home
                        </a>
                    </div>
                </div>
            </div>
    );
}
