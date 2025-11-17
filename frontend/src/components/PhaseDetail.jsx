import React from 'react';
import { CompilerPhaseName } from '../constants.js';
import { DownloadIcon } from './Icons.jsx';
import TreeView from './TreeView.jsx';

const MarkdownTable = ({ content }) => {
  try {
    const lines = content.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("Not enough lines for a table.");
    const parseRow = (row) => row.split('|').slice(1, -1).map(cell => cell.trim());
    const header = parseRow(lines[0]);
    if (!lines[1].includes('---')) throw new Error("Invalid markdown table separator.");
    const body = lines.slice(2).map(line => parseRow(line));
    if (header.length === 0 || body.some(row => row.length > 0 && row.length !== header.length)) {
        throw new Error("Mismatched column count in table body.");
    }

    return (
      <div className="overflow-auto max-h-64 bg-gray-900 p-3 rounded-md">
        <table className="w-full text-left text-sm font-roboto-mono">
          <thead className="border-b border-gray-600 text-gray-300"><tr>{header.map((cell, index) => (<th key={index} className="p-2 font-semibold">{cell}</th>))}</tr></thead>
          <tbody className="text-cyan-300">{body.map((row, rowIndex) => (<tr key={rowIndex} className="border-b border-gray-800 last:border-b-0">{row.map((cell, cellIndex) => (<td key={cellIndex} className="p-2">{cell}</td>))}</tr>))}</tbody>
        </table>
      </div>
    );
  } catch (e) {
    return <pre className="bg-gray-900 p-3 rounded-md text-sm text-cyan-300 font-roboto-mono overflow-auto max-h-64">{content}</pre>;
  }
};

const PhaseDetail = ({ phase, index, onExplain }) => {
  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilename = (phaseName) => {
    return `${phaseName.toLowerCase().replace(/ /g, '_')}_output.txt`;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 transition-all duration-300 hover:border-indigo-500 hover:shadow-lg">
      <h4 className="text-xl font-bold text-indigo-400 mb-3">{`${index + 1}. ${phase.name}`}</h4>
      <p className="text-gray-300 mb-4">{phase.explanation}</p>
      <div className="space-y-4">
        <div>
          <h5 className="font-semibold text-gray-200 mb-1">Input:</h5>
          <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-400 font-roboto-mono overflow-auto max-h-40">{phase.inputDescription}</pre>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <h5 className="font-semibold text-gray-200">Output:</h5>
            <button
              onClick={() => {
                  let content = phase.outputDescription;
                  if (phase.name === CompilerPhaseName.SYNTAX_ANALYSIS) {
                      try {
                          const treeData = JSON.parse(content);
                          content = JSON.stringify(treeData, null, 2);
                      } catch (e) { /* Fallback to raw content */ }
                  }
                  handleDownload(content, getFilename(phase.name));
              }}
              className="text-xs bg-gray-700 text-gray-300 font-semibold py-1 px-3 rounded-md hover:bg-gray-600 transition-all duration-200 flex items-center"
              title="Download Output"
            >
              <DownloadIcon />
              Download
            </button>
          </div>
          {phase.name === CompilerPhaseName.LEXICAL_ANALYSIS ? (
            <MarkdownTable content={phase.outputDescription} />
          ) : phase.name === CompilerPhaseName.SYNTAX_ANALYSIS ? (
            (() => {
              try {
                const treeData = JSON.parse(phase.outputDescription);
                return <TreeView data={treeData} />;
              } catch (e) {
                return <pre className="bg-gray-900 p-3 rounded-md text-sm text-cyan-300 font-roboto-mono overflow-auto max-h-64">{phase.outputDescription}</pre>;
              }
            })()
          ) : (
            <pre className="bg-gray-900 p-3 rounded-md text-sm text-cyan-300 font-roboto-mono overflow-auto max-h-64">{phase.outputDescription}</pre>
          )}
        </div>
      </div>
      <button
        onClick={() => onExplain(phase)}
        className="mt-4 text-sm bg-indigo-500/20 text-indigo-300 font-semibold py-2 px-4 rounded-md hover:bg-indigo-500/40 transition-all duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        Explain this phase in more detail
      </button>
    </div>
  )
};

export default PhaseDetail;