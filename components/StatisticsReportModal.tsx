import React from 'react';
import { BoundingBox } from './BoundingBox';

interface CountRow {
    type: string;
    segments: number;
    sourceWords: number;
    sourceChars: number;
    sourceTags: number;
    percentage: number;
    targetWords: number;
    targetChars: number;
    targetTags: number;
}

interface AnalysisRow {
    type: string;
    segments: number;
    sourceWords: number;
    weightedWords: number;
    sourceChars: number;
    weightedChars: number;
    sourceTags: number;
    percentage: number;
}


interface StatisticsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: { countsReport: CountRow[], analysisReport: AnalysisRow[] };
    projectName: string;
}

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{children}</th>
);

const TableCell = ({ children, isNumeric = false }: { children: React.ReactNode, isNumeric?: boolean }) => (
    <td className={`px-3 py-2 text-sm text-slate-700 whitespace-nowrap ${isNumeric ? 'text-right' : ''}`}>{children}</td>
);

export const StatisticsReportModal: React.FC<StatisticsReportModalProps> = ({ isOpen, onClose, reportData, projectName }) => {
    if (!isOpen) return null;

    const { countsReport, analysisReport } = reportData;

    const handlePrint = () => {
        const printContents = document.getElementById('print-area')?.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Statistics Report</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;margin:2rem}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background-color:#f2f2f2}h1,h2,h3{color:#333}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents || '');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-fast" onMouseDown={onClose}>
            <BoundingBox name="statistics report modal" className="!m-0 max-w-6xl w-full">
                <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-200 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-slate-800">Statistics Report</h2>
                        <p className="text-sm text-slate-500 mt-1">Statisztika - fájl: {projectName}</p>
                    </div>

                    <div id="print-area" className="flex-grow overflow-y-auto p-5 space-y-8">
                        {/* Counts Table */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Számlálás (Counts)</h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <TableHeader>Típus</TableHeader>
                                            <TableHeader>Szegmens</TableHeader>
                                            <TableHeader>Forrásszó</TableHeader>
                                            <TableHeader>Forráskarakter</TableHeader>
                                            <TableHeader>Forráscímke</TableHeader>
                                            <TableHeader>Százalék</TableHeader>
                                            <TableHeader>Célszó</TableHeader>
                                            <TableHeader>Célkarakter</TableHeader>
                                            <TableHeader>Célcímkék</TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {countsReport.map(row => (
                                            <tr key={row.type}>
                                                <TableCell>{row.type}</TableCell>
                                                <TableCell isNumeric>{row.segments.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.sourceWords.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.sourceChars.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.sourceTags.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.percentage.toFixed(2)}%</TableCell>
                                                <TableCell isNumeric>{row.targetWords.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.targetChars.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.targetTags.toLocaleString()}</TableCell>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Analysis Table */}
                        <div>
                             <h3 className="text-xl font-bold text-slate-700 mb-2">Analízis (Analysis)</h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <TableHeader>Típus</TableHeader>
                                            <TableHeader>Szegmens</TableHeader>
                                            <TableHeader>Forrásszó</TableHeader>
                                            <TableHeader>Forráskarakter</TableHeader>
                                            <TableHeader>Forráscímke</TableHeader>
                                            <TableHeader>Százalék</TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {analysisReport.map(row => (
                                            <tr key={row.type}>
                                                <TableCell>{row.type}</TableCell>
                                                <TableCell isNumeric>{row.segments.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.sourceWords.toLocaleString()} ({row.weightedWords.toFixed(1)})</TableCell>
                                                <TableCell isNumeric>{row.sourceChars.toLocaleString()} ({row.weightedChars.toFixed(1)})</TableCell>
                                                <TableCell isNumeric>{row.sourceTags.toLocaleString()}</TableCell>
                                                <TableCell isNumeric>{row.percentage.toFixed(2)}%</TableCell>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                        <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">Print</button>
                        <button onClick={onClose} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Close</button>
                    </div>
                </div>
            </BoundingBox>
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
