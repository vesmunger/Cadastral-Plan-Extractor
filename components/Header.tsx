
import React from 'react';
import { DocumentScannerIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 shadow-md border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <DocumentScannerIcon className="h-8 w-8 text-blue-600 dark:text-blue-500" />
        <h1 className="text-2xl font-bold ml-3 text-slate-800 dark:text-slate-100">
          Cadastral Plan Extractor
        </h1>
      </div>
    </header>
  );
};
