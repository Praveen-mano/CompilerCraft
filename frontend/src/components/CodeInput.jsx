import React, { useRef } from 'react';
import { CodeIcon, UploadIcon } from './Icons.jsx';

const CodeInput = ({ code, setCode, onAnalyze, isLoading, onFileError }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        onFileError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                setCode(text);
            } else {
                onFileError("Could not read file content as text.");
            }
        };
        reader.onerror = () => {
            onFileError("Failed to read the selected file.");
        };
        reader.readAsText(file);
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
              <div className="flex items-center mb-4">
                  <CodeIcon />
                  <h3 className="text-xl font-bold text-white">Source Code Input</h3>
              </div>
            </div>
            <textarea
                className="w-full flex-grow bg-gray-900 text-gray-300 font-roboto-mono p-4 rounded-md border-2 border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-y"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code or select a file to upload"
                aria-label="Source Code Input"
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.go,.rs,.html,.css"
            />
            <div className="flex-shrink-0">
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <button
                      onClick={handleUploadClick}
                      disabled={isLoading}
                      className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                  >
                      <UploadIcon />
                      Upload File
                  </button>
                  <button
                      onClick={onAnalyze}
                      disabled={isLoading || !code}
                      className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:transform-none"
                  >
                      {isLoading ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing...
                          </>
                      ) : (
                          "Analyze Code"
                      )}
                  </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Supported files: .txt, .js, .py, .java, .cpp, etc.</p>
            </div>
        </div>
    );
};

export default CodeInput;