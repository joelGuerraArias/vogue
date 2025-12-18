import React, { useState, useEffect, useRef } from 'react';
import { UploadZone } from './components/UploadZone';
import { generateTryOnImage, generateMultipleTryOnImages, generateFashionVideo, hasApiKey, saveApiKey, clearApiKey } from './services/geminiService';
import { generateMultipleSeeDreamImages, generateMultipleFluxImages, hasWavespeedApiKey, saveWavespeedApiKey, clearWavespeedApiKey } from './services/seedreamService';
import { processFile, urlToFile, createImageGrid } from './utils';
import { FileData, AppStatus, GenerationResult } from './types';

// Extended sample data matching user's specific wardrobe requests
const SAMPLE_CLOTHES = [
  // Tops (User's Real Wardrobe)
  { id: 1, type: 'top', url: '/clothes/red-shirt-1.png', label: 'Red Long Sleeve' },
  { id: 2, type: 'top', url: '/clothes/red-shirt-2.png', label: 'Red Crewneck' },
  { id: 3, type: 'top', url: '/clothes/black-dress-1.png', label: 'Black Dress' },
  { id: 4, type: 'top', url: '/clothes/black-dress-2.png', label: 'Black Flare Dress' },
  { id: 5, type: 'top', url: '/clothes/grey-coat-1.png', label: 'Grey Wool Coat' },
  { id: 6, type: 'top', url: '/clothes/grey-coat-2.png', label: 'Grey Long Coat' },
  
  // Bottoms (Additional samples)
  { id: 7, type: 'bottom', url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=600&q=80', label: 'Dark Wash Jeans' },
  { id: 8, type: 'bottom', url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80', label: 'Denim Shorts' },

  // Shoes (Kept for functionality)
  { id: 9, type: 'shoe', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', label: 'Red Sneakers' },
  { id: 10, type: 'shoe', url: 'https://images.unsplash.com/photo-1560769629-975e13f01b35?auto=format&fit=crop&w=600&q=80', label: 'Leather Shoes' },
  { id: 11, type: 'shoe', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80', label: 'Sport Runners' },
];

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<FileData | null>(null);
  
  // New State for Full Outfit
  const [topImage, setTopImage] = useState<FileData | null>(null);
  const [bottomImage, setBottomImage] = useState<FileData | null>(null);
  const [shoeImage, setShoeImage] = useState<FileData | null>(null);

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult>({});
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loadingSample, setLoadingSample] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'bottom' | 'shoe'>('all');
  
  // Custom wardrobe state
  const [customClothes, setCustomClothes] = useState<typeof SAMPLE_CLOTHES>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [wavespeedApiKeyInput, setWavespeedApiKeyInput] = useState('');
  const [hasWavespeedKey, setHasWavespeedKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'seedream' | 'flux'>('gemini');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
    loadCustomClothes();
  }, []);
  
  const loadCustomClothes = () => {
    const saved = localStorage.getItem('customClothes');
    if (saved) {
      try {
        setCustomClothes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom clothes:', e);
      }
    }
  };
  
  const saveCustomClothes = (clothes: typeof SAMPLE_CLOTHES) => {
    localStorage.setItem('customClothes', JSON.stringify(clothes));
    setCustomClothes(clothes);
  };

  const checkApiKey = () => {
    setHasKey(hasApiKey());
    setHasWavespeedKey(hasWavespeedApiKey());
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      saveApiKey(apiKeyInput.trim());
      setHasKey(true);
      setShowApiKeyModal(false);
      setApiKeyInput('');
      setError(null);
    } else {
      setError("Please enter a valid API Key");
    }
  };

  const handleSaveWavespeedApiKey = () => {
    if (wavespeedApiKeyInput.trim()) {
      saveWavespeedApiKey(wavespeedApiKeyInput.trim());
      setHasWavespeedKey(true);
      setShowApiKeyModal(false);
      setWavespeedApiKeyInput('');
      setError(null);
    } else {
      setError("Please enter a valid Wavespeed API Key");
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setHasKey(false);
    setApiKeyInput('');
  };

  const handleClearWavespeedApiKey = () => {
    clearWavespeedApiKey();
    setHasWavespeedKey(false);
    setWavespeedApiKeyInput('');
  };

  const handleSampleSelect = async (item: typeof SAMPLE_CLOTHES[0]) => {
    try {
      setLoadingSample(item.id);
      setError(null);
      
      const filename = `${item.label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      const file = await urlToFile(item.url, filename);
      const fileData = await processFile(file);

      if (item.type === 'top') setTopImage(fileData);
      else if (item.type === 'bottom') setBottomImage(fileData);
      else if (item.type === 'shoe') setShoeImage(fileData);

    } catch (err) {
      console.error(err);
      setError("Could not load this sample. Please try uploading manually.");
    } finally {
      setLoadingSample(null);
    }
  };

  const handleTryOn = async () => {
    // Require person and at least one item
    if (!personImage) {
      setError("Please upload a photo of the person first.");
      return;
    }
    if (!topImage && !bottomImage && !shoeImage) {
      setError("Please select at least one clothing item.");
      return;
    }

    // Check API key based on selected model
    if (selectedModel === 'gemini' && !hasKey) {
      setError("Please configure your Gemini API Key first.");
      setShowApiKeyModal(true);
      return;
    }
    
    if ((selectedModel === 'seedream' || selectedModel === 'flux') && !hasWavespeedKey) {
      setError("Please configure your Wavespeed API Key first.");
      setShowApiKeyModal(true);
      return;
    }

    setStatus(AppStatus.GENERATING_IMAGE);
    setError(null);
    setResult({});

    try {
      let imageUrls: string[];
      
      // Generate based on selected model
      if (selectedModel === 'gemini') {
        imageUrls = await generateMultipleTryOnImages(
          personImage,
          topImage,
          bottomImage,
          shoeImage
        );
      } else if (selectedModel === 'seedream') {
        imageUrls = await generateMultipleSeeDreamImages(
          personImage,
          topImage,
          bottomImage,
          shoeImage
        );
      } else {
        // Flux
        imageUrls = await generateMultipleFluxImages(
          personImage,
          topImage,
          bottomImage,
          shoeImage
        );
      }
      
      // Create a single grid image from the 4 photos
      const gridImage = await createImageGrid(imageUrls);
      
      setResult({ imageUrls, imageUrl: gridImage }); // gridImage is the combined 2x2 grid
      setStatus(AppStatus.IMAGE_READY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate images. Please check your API Key.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateVideo = async () => {
    if (!result.imageUrl) return;
    
    if (!hasKey) {
      setError("Please configure your API Key first.");
      setShowApiKeyModal(true);
      return;
    }

    setStatus(AppStatus.GENERATING_VIDEO);
    setError(null);

    try {
      const videoUrl = await generateFashionVideo(result.imageUrl);
      setResult(prev => ({ ...prev, videoUrl }));
      setStatus(AppStatus.VIDEO_READY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video.");
      setStatus(AppStatus.IMAGE_READY);
    }
  };

  const reset = () => {
    setPersonImage(null);
    setTopImage(null);
    setBottomImage(null);
    setShoeImage(null);
    setStatus(AppStatus.IDLE);
    setResult({});
    setError(null);
  };

  const handleUploadCustom = async (e: React.ChangeEvent<HTMLInputElement>, type: 'top' | 'bottom' | 'shoe') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileData = await processFile(file);
      
      const newItem = {
        id: Date.now(),
        type,
        url: fileData.previewUrl,
        label: file.name.replace(/\.[^/.]+$/, "").substring(0, 20),
      };
      
      const updated = [...customClothes, newItem];
      saveCustomClothes(updated);
      setShowUploadModal(false);
    }
  };
  
  const handleDeleteClothing = (id: number, isCustom: boolean) => {
    if (isCustom) {
      // Delete from custom clothes
      const updated = customClothes.filter(item => item.id !== id);
      saveCustomClothes(updated);
      
      // Clear selection if deleted item was selected
      const deletedItem = customClothes.find(item => item.id === id);
      if (deletedItem) {
        if (deletedItem.type === 'top' && topImage?.previewUrl === deletedItem.url) setTopImage(null);
        if (deletedItem.type === 'bottom' && bottomImage?.previewUrl === deletedItem.url) setBottomImage(null);
        if (deletedItem.type === 'shoe' && shoeImage?.previewUrl === deletedItem.url) setShoeImage(null);
      }
    } else {
      // Delete from sample clothes
      const deletedItem = SAMPLE_CLOTHES.find(item => item.id === id);
      if (deletedItem) {
        // Remove from SAMPLE_CLOTHES array
        const index = SAMPLE_CLOTHES.findIndex(item => item.id === id);
        if (index > -1) {
          SAMPLE_CLOTHES.splice(index, 1);
        }
        
        // Clear selection if deleted item was selected
        if (deletedItem.type === 'top' && topImage?.previewUrl.includes(deletedItem.url)) setTopImage(null);
        if (deletedItem.type === 'bottom' && bottomImage?.previewUrl.includes(deletedItem.url)) setBottomImage(null);
        if (deletedItem.type === 'shoe' && shoeImage?.previewUrl.includes(deletedItem.url)) setShoeImage(null);
      }
    }
  };

  const allClothes = [...SAMPLE_CLOTHES, ...customClothes];
  const filteredSamples = activeTab === 'all' 
    ? allClothes 
    : allClothes.filter(i => i.type === activeTab);

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-stone-900 selection:text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold tracking-tighter text-stone-900">
              VOGUE<span className="font-sans text-sm align-top font-normal tracking-widest ml-1 text-stone-500">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded">
              <span className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold">Model:</span>
              <button
                onClick={() => setSelectedModel('gemini')}
                className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                  selectedModel === 'gemini'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200'
                }`}
              >
                Gemini 3
              </button>
              <button
                onClick={() => setSelectedModel('seedream')}
                className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                  selectedModel === 'seedream'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200'
                }`}
              >
                SeeDream
              </button>
              <button
                onClick={() => setSelectedModel('flux')}
                className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                  selectedModel === 'flux'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200'
                }`}
              >
                Flux 2 Pro
              </button>
            </div>

            {/* API Status */}
            {selectedModel === 'gemini' ? (
              hasKey ? (
                <button 
                  onClick={handleClearApiKey}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-green-100 hover:bg-green-200 px-4 py-2 text-green-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Gemini Connected
                </button>
              ) : (
                <button 
                  onClick={() => setShowApiKeyModal(true)}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-red-100 hover:bg-red-200 px-4 py-2 text-red-900 transition-colors"
                >
                  Configure Gemini Key
                </button>
              )
            ) : (
              // SeeDream or Flux (both use Wavespeed API)
              hasWavespeedKey ? (
                <button 
                  onClick={handleClearWavespeedApiKey}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-green-100 hover:bg-green-200 px-4 py-2 text-green-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Wavespeed Connected
                </button>
              ) : (
                <button 
                  onClick={() => setShowApiKeyModal(true)}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-red-100 hover:bg-red-200 px-4 py-2 text-red-900 transition-colors"
                >
                  Configure Wavespeed Key
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32">
        
        {/* Intro */}
        {status === AppStatus.IDLE && (
            <div className="text-center mb-12 border-b border-stone-100 pb-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">The Complete Look</p>
            <h2 className="text-5xl md:text-7xl font-serif font-medium mb-4 leading-none italic text-stone-900">
                Style the <br/><span className="not-italic">Silhouette.</span>
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto font-light text-md">
                Upload your muse and curate the Top, Bottom, and Footwear.
            </p>
            </div>
        )}

        {/* Status Messages */}
        {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-900 text-red-800 text-center font-serif italic text-sm">
                {error}
            </div>
        )}

        {/* WORKSPACE GRID */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-1 lg:h-[600px] border border-stone-200 bg-stone-200 mb-12 transition-all duration-700 ${status !== AppStatus.IDLE ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          
          {/* LEFT: THE MUSE (Larger) */}
          <div className="lg:col-span-8 bg-white h-[500px] lg:h-full">
            <UploadZone
              label="The Muse"
              selectedFile={personImage}
              onFileSelect={setPersonImage}
              className="h-full w-full"
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          </div>

          {/* RIGHT: THE WARDROBE (Stack of 3) */}
          <div className="lg:col-span-4 flex flex-col gap-px h-full">
             
             {/* TOP SLOT */}
             <div className="flex-1 bg-white min-h-[180px]">
                <UploadZone
                    label="Top"
                    selectedFile={topImage}
                    onFileSelect={setTopImage}
                    className="h-full"
                    compact={true}
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 6l1.5 12h13L20 6M4 6l1-2h14l1 2" />
                        </svg>
                    }
                />
             </div>

             {/* BOTTOM SLOT */}
             <div className="flex-1 bg-white min-h-[180px]">
                <UploadZone
                    label="Bottom"
                    selectedFile={bottomImage}
                    onFileSelect={setBottomImage}
                    className="h-full"
                    compact={true}
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v14" />
                        </svg>
                    }
                />
             </div>

             {/* SHOES SLOT */}
             <div className="flex-1 bg-white min-h-[180px]">
                <UploadZone
                    label="Footwear"
                    selectedFile={shoeImage}
                    onFileSelect={setShoeImage}
                    className="h-full"
                    compact={true}
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />
             </div>

          </div>
        </div>

        {/* WARDROBE SELECTOR */}
        {status === AppStatus.IDLE && (
          <div className="mb-20">
            <div className="flex items-end justify-between mb-6 border-b border-stone-100 pb-4">
              <div className="flex items-end gap-6">
                <h3 className="font-serif italic text-2xl text-stone-900">Wardrobe</h3>
                <div className="flex gap-4">
                    {['all', 'top', 'bottom', 'shoe'].map(tab => (
                        <button 
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`text-[10px] uppercase tracking-widest hover:text-stone-900 transition-colors ${activeTab === tab ? 'text-stone-900 font-bold border-b border-stone-900' : 'text-stone-400'}`}
                        >
                          {tab === 'shoe' ? 'Footwear' : tab}s
                        </button>
                    ))}
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 transition-colors text-[10px] uppercase tracking-widest font-semibold"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Clothing
              </button>
            </div>
            
            <div className="overflow-x-auto pb-6 scrollbar-hide">
              <div className="flex gap-4 min-w-max">
                {filteredSamples.map((item) => {
                  const isCustom = customClothes.some(c => c.id === item.id);
                  return (
                    <div key={item.id} className="relative w-36 h-48 flex-shrink-0">
                      <button
                        onClick={() => handleSampleSelect(item)}
                        disabled={loadingSample !== null}
                        className={`
                          group relative w-full h-full bg-stone-50 border transition-all duration-300 overflow-hidden
                          ${(item.type === 'top' && topImage?.previewUrl.includes(item.url)) || 
                            (item.type === 'bottom' && bottomImage?.previewUrl.includes(item.url)) ||
                            (item.type === 'shoe' && shoeImage?.previewUrl.includes(item.url)) ||
                             loadingSample === item.id ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200 hover:border-stone-400'}
                        `}
                      >
                        <img 
                          src={item.url} 
                          alt={item.label} 
                          crossOrigin={item.url.startsWith('http') ? "anonymous" : undefined}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        
                        {loadingSample === item.id && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        
                        {/* Type Badge */}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-[8px] uppercase tracking-widest font-bold z-10">
                            {item.type}
                        </div>
                        
                        {/* Custom Badge */}
                        {isCustom && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[8px] uppercase tracking-widest font-bold z-10">
                            TU PRENDA
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/95 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                          <p className="text-[9px] uppercase tracking-widest text-center text-stone-900 font-semibold">{item.label}</p>
                        </div>
                      </button>
                      
                      {/* Delete Button - For ALL items */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar esta prenda?')) {
                            handleDeleteClothing(item.id, isCustom);
                          }
                        }}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center z-20 shadow-xl transition-all hover:scale-110 border-2 border-white"
                        title="Eliminar prenda"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {status === AppStatus.IDLE && (
          <div className="flex flex-col items-center justify-center mb-24">
            <button
              onClick={handleTryOn}
              disabled={!personImage || (!topImage && !bottomImage && !shoeImage)}
              className={`
                px-12 py-5 text-sm uppercase tracking-[0.25em] font-semibold transition-all duration-300 relative overflow-hidden group
                ${personImage && (topImage || bottomImage || shoeImage)
                  ? 'bg-stone-900 text-white hover:bg-stone-800 hover:px-14 shadow-xl shadow-stone-200' 
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
              `}
            >
              Generate Lookbook (4 Poses)
            </button>
            {personImage && (topImage || bottomImage || shoeImage) && (
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-4">
                Same Outfit • 4 Different Poses • Professional Lookbook
              </p>
            )}
          </div>
        )}

        {/* Loading States */}
        {(status === AppStatus.GENERATING_IMAGE || status === AppStatus.GENERATING_VIDEO) && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-px h-24 bg-stone-200 overflow-hidden relative mb-6">
                 <div className="absolute inset-0 bg-stone-900 animate-[ping_1.5s_ease-in-out_infinite]"></div>
            </div>
            <p className="font-serif text-2xl italic text-stone-900 animate-pulse mb-4">
              {status === AppStatus.GENERATING_IMAGE ? "Creating 4 Elegant Looks..." : "Filming the runway..."}
            </p>
            {status === AppStatus.GENERATING_IMAGE && (
              <>
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                  Frontal • Three Quarter • Profile • Dynamic Movement
                </p>
                {(selectedModel === 'flux' || selectedModel === 'seedream') && (
                  <p className="text-xs text-stone-500 italic">
                    {selectedModel === 'flux' 
                      ? 'Flux 2 Pro may take 2-3 minutes per photo (high quality processing)'
                      : 'SeeDream may take 1-2 minutes per photo (processing)'}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Results Section */}
        {(status === AppStatus.IMAGE_READY || status === AppStatus.VIDEO_READY || (status === AppStatus.ERROR && result.imageUrl)) && (
          <div className="animate-fade-in-up">
            
            {/* Image Result - Single 2x2 Grid Image */}
            {result.imageUrl && (
              <div className="mb-24">
                <div className="flex items-center gap-4 mb-8 justify-center">
                    <div className="h-px bg-stone-200 w-12"></div>
                    <h3 className="text-3xl font-serif italic">Lookbook - 4 Poses</h3>
                    <div className="h-px bg-stone-200 w-12"></div>
                </div>
                
                <div className="flex flex-col items-center">
                  {/* Single Grid Image with all 4 photos */}
                  <div className="p-8 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-100 max-w-full mx-auto">
                    <div className="w-full overflow-hidden bg-stone-50">
                        <img 
                        src={result.imageUrl} 
                        alt="4 Elegant Looks Collection" 
                        className="w-full h-auto"
                        />
                    </div>
                    <div className="pt-6 pb-2 flex justify-between items-end border-t border-stone-100 mt-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400">4 Styles in One</p>
                            <p className="font-serif italic text-lg">Complete Collection</p>
                        </div>
                        <a 
                            href={result.imageUrl} 
                            download="elegant-collection-grid.png"
                            className="text-xs font-bold uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
                        >
                            Download Grid
                        </a>
                    </div>
                  </div>
                  
                  {/* Download Individual Photos */}
                  {result.imageUrls && result.imageUrls.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                      <p className="w-full text-center text-[10px] uppercase tracking-widest text-stone-400 mb-2">Download Individual Poses:</p>
                      {result.imageUrls.map((url, idx) => {
                        const names = ['Frontal', '3/4 View', 'Profile', 'Dynamic'];
                        return (
                          <a
                            key={idx}
                            href={url}
                            download={`pose-${idx + 1}-${names[idx]}.png`}
                            className="px-4 py-2 text-[10px] uppercase tracking-widest border border-stone-200 hover:border-stone-900 hover:bg-stone-50 transition-colors"
                          >
                            Pose {idx + 1}: {names[idx]}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Generate Video Call to Action */}
                  {!result.videoUrl && status !== AppStatus.GENERATING_VIDEO && (
                    <div className="mt-16 text-center">
                      <p className="font-serif text-xl italic text-stone-500 mb-6">Bring the editorial to life</p>
                      <button
                        onClick={handleGenerateVideo}
                        className="group relative inline-flex items-center justify-center px-8 py-4 bg-transparent border border-stone-300 hover:border-stone-900 transition-colors overflow-hidden"
                      >
                         <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-stone-900 rounded-full group-hover:w-80 group-hover:h-80 opacity-5"></span>
                         <span className="relative flex items-center gap-3 text-sm uppercase tracking-widest font-semibold text-stone-900">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            Generate Runway Video
                         </span>
                      </button>
                      {!hasKey && <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-4">Premium Feature • Paid Key Required</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video Result */}
            {result.videoUrl && (
              <div className="max-w-4xl mx-auto" id="video-result">
                 <div className="flex items-center gap-4 mb-12 justify-center">
                    <div className="h-px bg-stone-200 w-24"></div>
                    <h3 className="text-3xl font-serif italic text-stone-900">On The Runway</h3>
                    <div className="h-px bg-stone-200 w-24"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <h4 className="font-serif text-4xl mb-4">Motion &<br/>Emotion</h4>
                        <p className="text-stone-500 font-light leading-relaxed mb-8">
                            Experience the flow of fabric and the confidence of the walk. 
                            Veo technology brings static fashion into a dynamic reality.
                        </p>
                        <button 
                            onClick={reset}
                            className="text-xs font-bold uppercase tracking-widest border-b border-stone-300 pb-1 hover:border-stone-900 transition-colors"
                        >
                            Create New Look
                        </button>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="relative p-2 border border-stone-200 shadow-2xl">
                            <video 
                            src={result.videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-auto bg-stone-100"
                            />
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowApiKeyModal(false)}>
          <div className="bg-white p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl italic">
                Configure {selectedModel === 'gemini' ? 'Gemini' : 'Wavespeed'} API Key
              </h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-stone-400 hover:text-stone-900">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedModel === 'gemini' ? (
              <div className="mb-6">
                <p className="text-stone-600 text-sm mb-4">
                  Para usar Gemini necesitas una API Key de Google AI Studio.
                </p>
                
                <div className="bg-stone-50 p-4 rounded border border-stone-200 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Cómo obtener tu API Key:</p>
                  <ol className="text-sm text-stone-600 space-y-1 list-decimal list-inside">
                    <li>Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aistudio.google.com</a></li>
                    <li>Inicia sesión con tu cuenta de Google</li>
                    <li>Click en "Create API Key"</li>
                    <li>Copia la clave y pégala abajo</li>
                  </ol>
                </div>
                
                <label className="block mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-stone-700 mb-2 block">Tu Gemini API Key:</span>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
                  />
                </label>
                
                <p className="text-xs text-stone-400 mt-2">
                  🔒 Tu API Key se guarda localmente en tu navegador y nunca se comparte.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-stone-600 text-sm mb-4">
                  Para usar {selectedModel === 'seedream' ? 'SeeDream' : 'Flux 2 Pro'} necesitas una API Key de Wavespeed.ai (misma key para ambos)
                </p>
                
                <div className="bg-stone-50 p-4 rounded border border-stone-200 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">Cómo obtener tu API Key:</p>
                  <ol className="text-sm text-stone-600 space-y-1 list-decimal list-inside">
                    <li>Ve a <a href="https://wavespeed.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">wavespeed.ai</a></li>
                    <li>Crea una cuenta o inicia sesión</li>
                    <li>Ve a API Keys en tu dashboard</li>
                    <li>Copia la clave y pégala abajo</li>
                  </ol>
                </div>
                
                <label className="block mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-stone-700 mb-2 block">Tu Wavespeed API Key:</span>
                  <input
                    type="password"
                    value={wavespeedApiKeyInput}
                    onChange={(e) => setWavespeedApiKeyInput(e.target.value)}
                    placeholder="ws_..."
                    className="w-full px-4 py-3 border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveWavespeedApiKey()}
                  />
                </label>
                
                <p className="text-xs text-stone-400 mt-2">
                  🔒 Tu API Key se guarda localmente en tu navegador y nunca se comparte.
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={selectedModel === 'gemini' ? handleSaveApiKey : handleSaveWavespeedApiKey}
                disabled={selectedModel === 'gemini' ? !apiKeyInput.trim() : !wavespeedApiKeyInput.trim()}
                className={`flex-1 px-6 py-3 text-sm uppercase tracking-widest font-semibold transition-colors ${
                  (selectedModel === 'gemini' ? apiKeyInput.trim() : wavespeedApiKeyInput.trim())
                    ? 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                Save API Key
              </button>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-6 py-3 text-sm uppercase tracking-widest font-semibold border-2 border-stone-200 hover:border-stone-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl italic">Add New Item</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-stone-400 hover:text-stone-900">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-stone-500 text-sm mb-6">Select the type of clothing you want to add:</p>
            
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadCustom(e, 'top')}
                  className="hidden"
                  id="upload-top"
                />
                <div className="border-2 border-stone-200 hover:border-stone-900 hover:bg-stone-50 p-4 cursor-pointer transition-all flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 6l1.5 12h13L20 6M4 6l1-2h14l1 2" />
                  </svg>
                  <span className="text-sm uppercase tracking-widest font-semibold">Add Top</span>
                </div>
              </label>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadCustom(e, 'bottom')}
                  className="hidden"
                  id="upload-bottom"
                />
                <div className="border-2 border-stone-200 hover:border-stone-900 hover:bg-stone-50 p-4 cursor-pointer transition-all flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v14" />
                  </svg>
                  <span className="text-sm uppercase tracking-widest font-semibold">Add Bottom</span>
                </div>
              </label>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadCustom(e, 'shoe')}
                  className="hidden"
                  id="upload-shoe"
                />
                <div className="border-2 border-stone-200 hover:border-stone-900 hover:bg-stone-50 p-4 cursor-pointer transition-all flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm uppercase tracking-widest font-semibold">Add Footwear</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-32 border-t border-stone-100 py-12 text-center">
          <p className="font-serif italic text-stone-400">StyleAI Magazine &copy; 2025</p>
      </footer>
    </div>
  );
};

export default App;