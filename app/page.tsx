'use client';
import { useState, DragEvent, ChangeEvent, useEffect, useRef } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [text, setText] = useState('');
  const [length, setLength] = useState('medium');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        setStatusText('Extracting PDF...');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extracted = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extracted += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setText(extracted);
      } else if (file.type.startsWith('image/')) {
        setStatusText('Running OCR...');
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const ret = await worker.recognize(file);
        await worker.terminate();
        setText(ret.data.text);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setText(e.target?.result as string);
        reader.readAsText(file);
      }
    } catch (err) {
      alert('Error reading file. Please try again.');
    }
    setLoading(false);
    setStatusText('');
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      const droppedFile = e.dataTransfer.files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;
      }
      processFile(droppedFile);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFile(e.target.files[0]);
    }
  };

  const handleSummarize = async () => {
    if (!text) {
      alert('Please upload a document or paste text first.');
      return;
    }
    setLoading(true);
    setStatusText('Generating Smart Summary...');
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data.summary);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
    setStatusText('');
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#030014] text-slate-200 selection:bg-cyan-500/30 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[150px] pointer-events-none animate-pulse" />
      
      <div className="max-w-7xl mx-auto p-6 lg:p-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-16">
        <div className="space-y-10 relative">
          <header className="group">
            <h1 className="text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-[length:200%_auto] hover:bg-right transition-all duration-700 ease-in-out cursor-default">
              Nexus AI
            </h1>
            <p className="text-slate-400 text-lg font-medium tracking-wide">
              Next-generation document intelligence.
            </p>
          </header>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative group flex flex-col items-center justify-center p-14 rounded-3xl transition-all duration-500 ease-out transform ${isDragging ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-[0_0_50px_-10px_rgba(34,211,238,0.3)]' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(139,92,246,0.15)] hover:border-violet-500/50'} border-2`}
          >
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDragging && 'opacity-100'}`} />
            
            <div className="mb-6 text-slate-400 group-hover:text-cyan-400 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 ease-out">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <p className="mb-3 text-slate-200 font-semibold text-lg tracking-wide group-hover:text-white transition-colors">Drag & drop files here</p>
            <p className="text-sm text-slate-500 mb-8 font-medium">PDF, PNG, JPG, TXT</p>
            
            <label className="relative cursor-pointer overflow-hidden rounded-xl p-[1px] group/btn">
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl opacity-70 group-hover/btn:opacity-100 group-hover/btn:blur-sm transition-all duration-500"></span>
              <div className="relative bg-[#030014] text-slate-200 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all duration-500 flex items-center justify-center">
                Browse Files
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf,image/*,.txt" 
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            {fileName && <p className="mt-5 text-cyan-300 text-sm font-bold px-5 py-2 bg-cyan-950/50 rounded-full border border-cyan-500/30 truncate max-w-full shadow-[0_0_15px_-3px_rgba(34,211,238,0.2)]">{fileName}</p>}
          </div>
          
          <div className="space-y-4 group">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-400 tracking-wider uppercase">Extracted Content</label>
              <select 
                value={length} 
                onChange={(e) => setLength(e.target.value)} 
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-sm text-slate-200 px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all cursor-pointer font-medium appearance-none shadow-sm"
              >
                <option value="short">Short Summary</option>
                <option value="medium">Medium Summary</option>
                <option value="long">Detailed Summary</option>
              </select>
            </div>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Raw text will appear here..."
              className="w-full h-36 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-300 p-5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none transition-all duration-300 resize-none shadow-inner hover:bg-slate-900/80" 
            />
          </div>

          <button 
            onClick={handleSummarize} 
            disabled={loading} 
            className="w-full relative overflow-hidden group bg-slate-900 border border-slate-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"></div>
            <div className="relative z-10 flex justify-center items-center gap-3 tracking-wide">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-cyan-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {statusText}
                </>
              ) : 'Generate Executive Summary'}
            </div>
          </button>
        </div>

        <div className="h-full">
          <div className="h-full min-h-[650px] bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col relative overflow-hidden group hover:border-slate-600 transition-colors duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
            
            <h2 className="text-2xl font-bold text-slate-100 mb-8 flex items-center gap-3 tracking-wide">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-violet-500/20 transition-colors duration-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 group-hover:text-violet-400 transition-colors"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              Synthesis Output
            </h2>
            
            {summary ? (
              <div className="prose prose-invert prose-lg max-w-none flex-grow overflow-y-auto pr-4 custom-scrollbar">
                <div className="text-slate-300 leading-loose whitespace-pre-wrap font-medium">
                  {summary}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-600 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 opacity-40"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <p className="text-center text-lg font-medium tracking-wide">Awaiting document payload...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}