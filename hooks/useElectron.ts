import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      onFilesSelected: (callback: (filePaths: string[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      platform: string;
      readFile: (filePath: string) => Promise<{
        success: boolean;
        data?: ArrayBuffer;
        name?: string;
        path?: string;
        error?: string;
      }>;
    };
  }
}

export const useElectron = () => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const handleElectronFiles = useCallback(async (filePaths: string[], onFilesLoaded: (files: File[]) => void) => {
    if (!window.electronAPI) return;

    const files: File[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await window.electronAPI.readFile(filePath);
        if (result.success && result.data && result.name) {
          // Convert ArrayBuffer to File
          const file = new File([result.data], result.name, {
            type: getMimeType(result.name)
          });
          files.push(file);
        }
      } catch (error) {
        console.error('Failed to read file:', filePath, error);
      }
    }

    if (files.length > 0) {
      onFilesLoaded(files);
    }
  }, []);

  const setupElectronFileHandler = useCallback((onFilesLoaded: (files: File[]) => void) => {
    if (!window.electronAPI) return;

    const handleFilesSelected = (filePaths: string[]) => {
      handleElectronFiles(filePaths, onFilesLoaded);
    };

    window.electronAPI.onFilesSelected(handleFilesSelected);

    return () => {
      window.electronAPI?.removeAllListeners('files-selected');
    };
  }, [handleElectronFiles]);

  return {
    isElectron,
    setupElectronFileHandler,
    handleElectronFiles
  };
};

// Helper function to get MIME type from file extension
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm',
    'flv': 'video/x-flv',
    'wmv': 'video/x-ms-wmv',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    
    // Documents
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'html': 'text/html'
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}
