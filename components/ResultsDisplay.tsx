
import React, { useMemo } from 'react';
import { ExtractedData, ImageDimensions } from '../types';
import { PhotoIcon, TableIcon, MapPinIcon, RulerIcon } from './Icons';

interface ResultsDisplayProps {
  previewUrl: string | null;
  extractedData: ExtractedData | null;
  imageDimensions: ImageDimensions | null;
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  isLoading: boolean;
}

const Placeholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
    <PhotoIcon className="h-24 w-24 mb-4 text-slate-400 dark:text-slate-500" />
    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Upload a Plan</h3>
    <p className="mt-1 max-w-sm">Your uploaded cadastral plan will be displayed here. After processing, the extracted parcel and metadata will appear.</p>
  </div>
);


const MetadataTable: React.FC<{ metadata: ExtractedData['metadata'] }> = ({ metadata }) => {
  const entries = Object.entries(metadata).filter(([, value]) => value); // Filter out empty values
  if (entries.length === 0) return null;

  return (
    <div className="w-full">
        <div className="flex items-center mb-3">
            <TableIcon className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Extracted Metadata</h3>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {entries.map(([key, value]) => (
                        <tr key={key}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1')}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold">
                                {value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const AreaDisplay: React.FC<{ polygon: ExtractedData['polygon'], dimensions: ImageDimensions | null }> = ({ polygon, dimensions }) => {
    const areaData = useMemo(() => {
        if (polygon.length < 3) return null;

        // Shoelace formula for normalized area
        let normalizedArea = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            normalizedArea += polygon[i].x * polygon[j].y;
            normalizedArea -= polygon[j].x * polygon[i].y;
        }
        normalizedArea = Math.abs(normalizedArea) / 2;

        // Standard scale assumption: Image width = 100 meters
        // This is a placeholder for actual scale extraction
        const ASSUMED_WIDTH_METERS = 100;
        const aspectRatio = dimensions ? dimensions.naturalHeight / dimensions.naturalWidth : 1;
        const ASSUMED_HEIGHT_METERS = ASSUMED_WIDTH_METERS * aspectRatio;
        
        const sqm = normalizedArea * ASSUMED_WIDTH_METERS * ASSUMED_HEIGHT_METERS;
        const acres = sqm / 4046.86;
        const hectares = sqm / 10000;

        return { sqm, acres, hectares };
    }, [polygon, dimensions]);

    if (!areaData) return null;

    return (
        <div className="w-full bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center mb-3">
                <RulerIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Calculated Area</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Square Meters</p>
                    <p className="text-xl font-mono font-bold text-blue-900 dark:text-blue-100">
                        {areaData.sqm.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²
                    </p>
                </div>
                <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Hectares</p>
                    <p className="text-xl font-mono font-bold text-blue-900 dark:text-blue-100">
                        {areaData.hectares.toLocaleString(undefined, { maximumFractionDigits: 4 })} ha
                    </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Acres (Approx)</p>
                    <p className="text-lg font-mono font-bold text-blue-900 dark:text-blue-100">
                        {areaData.acres.toLocaleString(undefined, { maximumFractionDigits: 4 })} ac
                    </p>
                </div>
            </div>
            <p className="mt-3 text-[10px] text-blue-500 dark:text-blue-400 italic">
                * Area calculated assuming a standard image width of 100m. Actual area may vary based on plan scale.
            </p>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ previewUrl, extractedData, imageDimensions, onImageLoad, isLoading }) => {
  if (!previewUrl) {
    return <Placeholder />;
  }

  const polygonPoints = extractedData?.polygon && imageDimensions
    ? extractedData.polygon.map(p => `${p.x * imageDimensions.width},${p.y * imageDimensions.height}`).join(' ')
    : '';

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-6 h-full">
        <div className="md:w-3/5 lg:w-2/3 h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden relative">
            <img 
                src={previewUrl} 
                alt="Cadastral Plan Preview" 
                onLoad={onImageLoad}
                className="max-w-full max-h-full object-contain"
            />
            {polygonPoints && imageDimensions && (
                <svg
                    className="absolute top-0 left-0"
                    width={imageDimensions.width}
                    height={imageDimensions.height}
                    viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                >
                    <polygon
                        points={polygonPoints}
                        className="fill-blue-500/30 stroke-blue-600 stroke-2"
                    />
                </svg>
            )}
        </div>
        <div className="md:w-2/5 lg:w-1/3 space-y-6 overflow-y-auto pr-2">
          {extractedData ? (
             <>
              <MetadataTable metadata={extractedData.metadata} />
              
              {extractedData.polygon.length > 0 && (
                  <>
                    <AreaDisplay polygon={extractedData.polygon} dimensions={imageDimensions} />
                    
                    <div className="w-full">
                        <div className="flex items-center mb-2">
                            <MapPinIcon className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Parcel Polygon</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            The identified parcel boundary has been overlaid on the plan image in blue.
                        </p>
                    </div>
                  </>
              )}
             </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
                {isLoading ? (
                    <>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Analysis in Progress...</h3>
                        <p className="mt-1 text-sm">The AI is reading the plan. This can take up to a minute.</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Ready to Process</h3>
                        <p className="mt-1 text-sm">Click "Process Plan with AI" to extract information from this document.</p>
                    </>
                )}
            </div>
          )}
        </div>
    </div>
  );
};
