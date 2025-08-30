'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, X, Settings, FileText, Image, Video, Music } from 'lucide-react';
import { ConversionSettings } from './ConversionSettings';
import { FileProcessor } from '@/lib/fileProcessor';

interface ConversionFile {
  id: string;
  file: File;
  outputFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  outputBlob?: Blob;
  error?: string;
}

const SUPPORTED_FORMATS = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'],
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
  audio: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'],
  document: ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'html']
};

const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  for (const [type, formats] of Object.entries(SUPPORTED_FORMATS)) {
    if (formats.includes(ext)) return type;
  }
  return 'unknown';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image': return <Image className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'audio': return <Music className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

export function FileConverter() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    quality: 80,
    width: 0,
    height: 0,
    maintainAspectRatio: true,
    compressionLevel: 6
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      outputFormat: '',
      status: 'pending' as const,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateOutputFormat = (id: string, format: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, outputFormat: format } : f
    ));
  };

  const convertFiles = async () => {
    setIsProcessing(true);
    const processor = new FileProcessor();

    for (const file of files) {
      if (file.status !== 'pending' || !file.outputFormat) continue;

      try {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing', progress: 0 } : f
        ));

        const result = await processor.convertFile(
          file.file,
          file.outputFormat,
          settings,
          (progress) => {
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ));
          }
        );

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            outputBlob: result 
          } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Conversion failed'
          } : f
        ));
      }
    }

    setIsProcessing(false);
  };

  const downloadFile = (file: ConversionFile) => {
    if (!file.outputBlob) return;

    const url = URL.createObjectURL(file.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.file.name.split('.')[0]}.${file.outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    files.filter(f => f.status === 'completed').forEach(downloadFile);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>File Converter</CardTitle>
              <CardDescription>
                Drop files here or click to select. All processing happens locally.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-gray-500">
                  Supports images, videos, audio, and documents
                </p>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-6">
              <ConversionSettings settings={settings} onSettingsChange={setSettings} />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Files to Convert</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={convertFiles}
                    disabled={isProcessing || files.every(f => !f.outputFormat)}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? 'Converting...' : 'Convert All'}
                  </Button>
                  {files.some(f => f.status === 'completed') && (
                    <Button
                      variant="outline"
                      onClick={downloadAll}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {files.map((file) => {
                  const fileType = getFileType(file.file.name);
                  const availableFormats = SUPPORTED_FORMATS[fileType as keyof typeof SUPPORTED_FORMATS] || [];

                  return (
                    <Card key={file.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getFileIcon(fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Badge variant="secondary">{fileType}</Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <Select
                            value={file.outputFormat}
                            onValueChange={(format) => updateOutputFormat(file.id, format)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFormats.map(format => (
                                <SelectItem key={format} value={format}>
                                  {format.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {file.status === 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => downloadFile(file)}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {file.status === 'processing' && (
                        <div className="mt-3">
                          <Progress value={file.progress} className="w-full" />
                          <p className="text-sm text-gray-500 mt-1">
                            Converting... {file.progress}%
                          </p>
                        </div>
                      )}

                      {file.status === 'error' && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-300 text-sm">
                          Error: {file.error}
                        </div>
                      )}

                      {file.status === 'completed' && (
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded text-green-700 dark:text-green-300 text-sm">
                          ✓ Conversion completed successfully
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
