import React from 'react';

const ExplanationModal = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 id="modal-title" className="text-2xl font-bold text-indigo-400">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full -mt-2 -mr-2" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="prose prose-invert max-w-none text-gray-300">{isLoading ? (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>) : (<div className="text-gray-300 whitespace-pre-wrap font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: content }}></div>)}</div>
      </div>
    </div>
  );
};

export default ExplanationModal;
