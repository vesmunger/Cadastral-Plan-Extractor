
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { ExtractedData, ImageDimensions } from './types';
import { extractCadastralInfo } from './services/geminiService';
import { AlertTriangle, CheckCircle } from './components/Icons';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    // Clean up the object URL when the component unmounts or the file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setFile(selectedFile);
      setExtractedData(null);
      setError(null);
      setImageDimensions(null);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };
  
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      const { clientWidth, clientHeight, naturalWidth, naturalHeight } = event.currentTarget;
      setImageDimensions({ width: clientWidth, height: clientHeight, naturalWidth, naturalHeight });
  };

  const processPlan = useCallback(async () => {
    if (!file) {
      setError("Please upload a plan file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    
    try {
      setLoadingMessage("Preparing plan for analysis...");
      await new Promise(res => setTimeout(res, 500));

      setLoadingMessage("Contacting AI... This may take a moment.");
      const data = await extractCadastralInfo(file);
      
      setLoadingMessage("Processing results...");
      await new Promise(res => setTimeout(res, 500));

      setExtractedData(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during processing.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [file]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">1. Upload Plan</h2>
              <FileUpload onFileSelect={handleFileChange} disabled={isLoading} />
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
               <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">2. Extract Data</h2>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                 Once your plan is uploaded, click the button below to start the AI extraction process.
               </p>
              <button
                onClick={processPlan}
                disabled={!file || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : "Process Plan with AI"}
              </button>
            </div>

            {isLoading && (
               <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                  <p className="text-sm text-center text-blue-700 dark:text-blue-300 font-medium">{loadingMessage}</p>
               </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg border border-red-200 dark:border-red-700 flex items-start space-x-3">
                 <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                 <div>
                    <h3 className="font-bold text-red-800 dark:text-red-200">Processing Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                 </div>
              </div>
            )}

            {extractedData && !isLoading && (
              <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg border border-green-200 dark:border-green-700 flex items-start space-x-3">
                 <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                 <div>
                    <h3 className="font-bold text-green-800 dark:text-green-200">Success</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Extraction complete. Review the results.</p>
                 </div>
              </div>
            )}
          </aside>

          {/* Right Column: Display */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6 min-h-[60vh] flex flex-col">
            <ResultsDisplay 
              previewUrl={previewUrl}
              extractedData={extractedData}
              imageDimensions={imageDimensions}
              onImageLoad={handleImageLoad}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
