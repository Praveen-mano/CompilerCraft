import React, { useRef, useEffect } from 'react';

const ChatInterface = ({ history, onSendMessage, isLoading, input, setInput, isAnalysisDone }) => {
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSendMessage();
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col h-full">
            <h3 className="text-2xl font-bold text-white mb-4 flex-shrink-0">Compiler Assistant</h3>
            <div className="bg-gray-900 rounded-md p-4 overflow-y-auto flex flex-col space-y-4 flex-grow">
                {history.length === 0 && (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                        <p>Ask a follow-up question after analyzing code.</p>
                    </div>
                )}
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xl p-3 rounded-lg bg-gray-700 text-gray-200 flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex gap-2 flex-shrink-0">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!isAnalysisDone ? "Analyze code first..." : "Ask a question..."}
                    className="flex-grow bg-gray-700 text-gray-200 rounded-md p-2 border border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={1}
                    disabled={!isAnalysisDone || isLoading}
                />
                <button
                    onClick={onSendMessage}
                    disabled={!isAnalysisDone || isLoading || !input.trim()}
                    className="bg-indigo-600 text-white font-bold p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
