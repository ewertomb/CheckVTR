
import React, { useState, useEffect } from 'react';

interface ImageGalleryModalProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = photos[currentIndex];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EVIDENCIA_RAIO_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center pointer-events-none">
        <button onClick={onClose} className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
          Fechar
        </button>
        <div className="flex gap-4 pointer-events-auto">
          <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
            Baixar Foto
          </button>
          {photos.length > 1 && (
            <div className="bg-black/50 text-white px-4 py-3 rounded-2xl font-black text-[10px] border border-white/10">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <>
          <button className="hidden md:flex absolute left-8 p-4 bg-black/50 text-white rounded-full hover:bg-blue-600 transition-all" onClick={handlePrev}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="hidden md:flex absolute right-8 p-4 bg-black/50 text-white rounded-full hover:bg-blue-600 transition-all" onClick={handleNext}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <img 
        src={photos[currentIndex]} 
        className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
        onClick={(e) => e.stopPropagation()} 
        alt="Evidência" 
      />
    </div>
  );
};

export default ImageGalleryModal;
