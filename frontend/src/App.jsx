import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeCode, explainPhase, askFollowUpQuestion } from './services/geminiService.js';
import Header from './components/Header.jsx';
import CodeInput from './components/CodeInput.jsx';
import AnalysisOutput from './components/AnalysisOutput.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import ExplanationModal from './components/ExplanationModal.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';


const App = () => {
  const [code, setCode] = useState('int main() {\n  int a = 5;\n  int b = 10;\n  int c = a + b;\n  return c;\n}');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [hSplit, setHSplit] = useState(50);
  const [vSplit, setVSplit] = useState(60);

  const isResizingVertical = useRef(false);
  const isResizingHorizontal = useRef(false);
  const mainRef = useRef(null);
  const rightPanelRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (isResizingVertical.current && mainRef.current) {
        const mainRect = mainRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - mainRect.left) / mainRect.width) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) {
            setHSplit(newLeftWidth);
        }
    }
    if (isResizingHorizontal.current && rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        const newTopHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newTopHeight > 15 && newTopHeight < 85) {
            setVSplit(newTopHeight);
        }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingVertical.current = false;
    isResizingHorizontal.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startVerticalResize = (e) => {
    e.preventDefault();
    isResizingVertical.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startHorizontalResize = (e) => {
    e.preventDefault();
    isResizingHorizontal.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setFileError('');
    setIsLoading(true);
    setAnalysisResult(null);
    setChatHistory([]);
    try {
      const result = await analyzeCode(code);
      setAnalysisResult(result);
      setCurrentPhaseIndex(0);
    } catch (e) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleExplainPhase = useCallback(async (phase) => {
    setIsModalOpen(true);
    setModalTitle(`Deep Dive: ${phase.name}`);
    setModalContent('');
    setIsModalLoading(true);
    try {
      const explanation = await explainPhase(code, phase.name, phase.explanation);
      setModalContent(explanation);
    } catch (e) {
      setModalContent(`Sorry, I couldn't get a more detailed explanation. Error: ${e.message}`);
    } finally {
      setIsModalLoading(false);
    }
  }, [code]);

  const handleCloseModal = () => setIsModalOpen(false);

  const handleNextPhase = () => {
    if (analysisResult && currentPhaseIndex < analysisResult.phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    }
  };

  const handlePrevPhase = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(prev => prev - 1);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || !analysisResult) return;

    const userMessage = chatInput;
    const newHistory = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await askFollowUpQuestion(code, analysisResult, chatHistory, userMessage);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', content: `Sorry, I ran into an error: ${e.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [code, analysisResult, chatHistory, chatInput]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <Header />
      <main ref={mainRef} className="w-full flex-grow max-w-7xl mx-auto px-4 md:px-8 pb-8 flex overflow-hidden">
        {/* Left Panel: Analysis */}
        <div className="h-full" style={{ width: `${hSplit}%` }}>
            {isLoading && !analysisResult ? (
                <div className="bg-gray-800 rounded-xl shadow-2xl h-full flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <AnalysisOutput
                    result={analysisResult}
                    code={code}
                    error={error}
                    onExplain={handleExplainPhase}
                    currentPhaseIndex={currentPhaseIndex}
                    onNextPhase={handleNextPhase}
                    onPrevPhase={handlePrevPhase}
                />
            )}
        </div>
        
        <div 
            onMouseDown={startVerticalResize}
            className="w-2 h-full cursor-col-resize flex-shrink-0 bg-gray-700/50 hover:bg-indigo-500 transition-colors duration-200 mx-2 rounded-full"
            aria-label="Resize panels horizontally"
            role="separator"
            aria-orientation="vertical"
        />

        {/* Right Panel: Code + Chat */}
        <div ref={rightPanelRef} className="h-full flex flex-col flex-grow" style={{ width: `calc(100% - ${hSplit}% - 24px)` }}>
            <div className="w-full" style={{ height: `${vSplit}%` }}>
                 <CodeInput
                    code={code}
                    setCode={setCode}
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    onFileError={setFileError}
                  />
                  {fileError && <p className="text-red-400 text-center mt-1 text-sm">{fileError}</p>}
            </div>
            
            <div
                onMouseDown={startHorizontalResize}
                className="h-2 w-full cursor-row-resize flex-shrink-0 bg-gray-700/50 hover:bg-indigo-500 transition-colors duration-200 my-2 rounded-full"
                aria-label="Resize panels vertically"
                role="separator"
                aria-orientation="horizontal"
            />

            <div className="w-full flex-grow" style={{ height: `calc(100% - ${vSplit}% - 24px)` }}>
                <ChatInterface
                    history={chatHistory}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                    input={chatInput}
                    setInput={setChatInput}
                    isAnalysisDone={!!analysisResult}
                />
            </div>
        </div>
      </main>
      <ExplanationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        content={modalContent}
        isLoading={isModalLoading}
      />
    </div>
  );
};

export default App;
