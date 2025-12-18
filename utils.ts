import { FileData } from './types';

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processFile = async (file: File): Promise<FileData> => {
  const base64 = await readFileAsBase64(file);
  const previewUrl = URL.createObjectURL(file);
  return {
    file,
    previewUrl,
    base64,
    mimeType: file.type,
  };
};

export const urlToFile = async (url: string, filename: string): Promise<File> => {
  const fetchOptions = url.startsWith('http') ? { mode: 'cors' as RequestMode } : {};
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Creates a 2x2 grid from 4 images with elegant styling
 */
export const createImageGrid = async (imageUrls: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Pose names for labels
    const poseNames = ['Frontal Pose', '3/4 View Pose', 'Profile Pose', 'Dynamic Pose'];
    
    // Load all images first
    const images = imageUrls.map(url => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      return img;
    });

    // Wait for all images to load
    Promise.all(
      images.map(img => 
        new Promise<HTMLImageElement>((res, rej) => {
          img.onload = () => res(img);
          img.onerror = rej;
        })
      )
    ).then(loadedImages => {
      // Get dimensions from first image
      const imgWidth = loadedImages[0].width;
      const imgHeight = loadedImages[0].height;
      
      // Grid settings
      const gap = 40; // Gap between images
      const padding = 60; // Outer padding
      const labelHeight = 80; // Space for labels
      
      // Calculate canvas size
      canvas.width = (imgWidth * 2) + gap + (padding * 2);
      canvas.height = (imgHeight * 2) + gap + (padding * 2) + (labelHeight * 2);
      
      // Fill background with elegant color
      ctx.fillStyle = '#fafaf9'; // stone-50
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw title
      ctx.fillStyle = '#1c1917'; // stone-900
      ctx.font = 'italic 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Lookbook - 4 Poses', canvas.width / 2, 50);
      
      // Draw images in 2x2 grid
      const positions = [
        { x: padding, y: padding + labelHeight }, // Top-left
        { x: padding + imgWidth + gap, y: padding + labelHeight }, // Top-right
        { x: padding, y: padding + imgHeight + gap + labelHeight }, // Bottom-left
        { x: padding + imgWidth + gap, y: padding + imgHeight + gap + labelHeight } // Bottom-right
      ];
      
      loadedImages.forEach((img, index) => {
        const pos = positions[index];
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        
        // Draw white background for image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pos.x - 10, pos.y - 10, imgWidth + 20, imgHeight + 20);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Draw image
        ctx.drawImage(img, pos.x, pos.y, imgWidth, imgHeight);
        
        // Draw border
        ctx.strokeStyle = '#e7e5e4'; // stone-200
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - 10, pos.y - 10, imgWidth + 20, imgHeight + 20);
        
        // Draw label
        ctx.fillStyle = '#78716c'; // stone-500
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(poseNames[index].toUpperCase(), pos.x + imgWidth / 2, pos.y + imgHeight + 40);
      });
      
      // Draw footer
      ctx.fillStyle = '#a8a29e'; // stone-400
      ctx.font = 'italic 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Spring / Summer 2025', canvas.width / 2, canvas.height - 30);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png', 1.0));
    }).catch(reject);
  });
};