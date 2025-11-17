import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, DownloadIcon } from './Icons.jsx';
import ErrorDisplay from './ErrorDisplay.jsx';
import PhaseDetail from './PhaseDetail.jsx';
import { CompilerPhaseName } from '../constants.js';

const AnalysisOutput = ({ result, error, onExplain, currentPhaseIndex, onNextPhase, onPrevPhase, code }) => {
  const handleDownloadReport = () => {
    if (!result || !result.isValidCode) return;

    let reportContent = '';

    // Phase 1: Raw Text
    reportContent += '============ PHASE 1 — RAW TEXT ============\n';
    reportContent += code + '\n\n';
    const rawTextExplanation = '   Raw text phase: the compiler reads the source file as plain text.\n   This includes preprocessor lines like #include and all comments/whitespace.\n   If the file is empty or missing, the run aborts with a helpful message.';
    reportContent += rawTextExplanation + '\n\n';

    // Subsequent phases from the analysis result
    result.phases.forEach((phase, index) => {
      const phaseNumber = index + 2;
      const phaseNameUpper = phase.name.toUpperCase();
      
      reportContent += `============ PHASE ${phaseNumber} — ${phaseNameUpper} ============\n`;
      
      let outputDescription = phase.outputDescription;

      if (phase.name === CompilerPhaseName.SYNTAX_ANALYSIS) {
        try {
          // Pretty-print JSON for readability in the text file
          outputDescription = JSON.stringify(JSON.parse(phase.outputDescription), null, 2);
        } catch (e) {
          // If it's not valid JSON, just use the raw string
        }
      }
      
      reportContent += outputDescription + '\n\n';

      const indentedExplanation = phase.explanation
        .split('\n')
        .map(line => '   ' + line)
        .join('\n');
      reportContent += indentedExplanation + '\n\n';
    });
    
    // Create and trigger download
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compiler_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (error) {
    return <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 text-red-200 h-full">{error}</div>;
  }
  
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-xl h-full border-2 border-dashed border-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        <h3 className="text-xl font-bold text-white">Awaiting Analysis</h3>
        <p className="text-gray-400 mt-2">Enter your code and click "Analyze Code" to see the compilation process unfold.</p>
      </div>
    );
  }

  const currentPhase = result.phases.length > 0 ? result.phases[currentPhaseIndex] : null;

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center">
            {result.isValidCode ? <CheckCircleIcon /> : <ExclamationCircleIcon />}
            <h3 className="text-2xl font-bold text-white">Analysis Result: <span className={result.isValidCode ? 'text-green-400' : 'text-red-400'}>{result.isValidCode ? "Valid Code" : "Invalid Code"}</span></h3>
        </div>
        {result.isValidCode && (
          <button 
            onClick={handleDownloadReport}
            className="text-sm bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-all duration-200 flex items-center"
            title="Download Full Report"
          >
            <DownloadIcon />
            <span className="ml-2">Download Report</span>
          </button>
        )}
      </div>
      
      {result.error && <div className="flex-shrink-0"><ErrorDisplay error={result.error} /></div>}

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {currentPhase ? (
          <PhaseDetail phase={currentPhase} index={currentPhaseIndex} onExplain={onExplain} />
        ) : !result.error && <p className="text-gray-400">No phases to display.</p>}
      </div>
      
      {result.phases.length > 1 && (
        <div className="flex-shrink-0 flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
          <button 
            onClick={onPrevPhase} 
            disabled={currentPhaseIndex === 0}
            className="flex items-center bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-400">
            Phase {currentPhaseIndex + 1} of {result.phases.length}
          </span>
          <button 
            onClick={onNextPhase} 
            disabled={currentPhaseIndex === result.phases.length - 1}
            className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisOutput;
