'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, X, Settings, FileText, Image, Video, Music, Zap } from 'lucide-react';
import { ConversionSettings } from './ConversionSettings';
import { FileProcessor } from '@/lib/fileProcessor';
import { useElectron } from '@/hooks/useElectron';

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

  // Removed subscription/payment state for desktop app

  // Electron integration
  const { isElectron, setupElectronFileHandler } = useElectron();

  // Setup Electron file handler
  useEffect(() => {
    if (isElectron) {
      const cleanup = setupElectronFileHandler((electronFiles) => {
        console.log('Electron files received:', electronFiles.map(f => f.name));

        // For desktop app, accept all files without subscription checks
        const newFiles = electronFiles.map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          outputFormat: '',
          status: 'pending' as const,
          progress: 0
        }));
        setFiles(prev => [...prev, ...newFiles]);
      });

      return cleanup;
    }
  }, [isElectron, setupElectronFileHandler]);

  // Removed subscription/usage functions for desktop app

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles.map(f => f.name));

    // For desktop app, accept all files without subscription checks
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      outputFormat: '',
      status: 'pending' as const,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true // Disable default click behavior so we can handle it manually
  });

  // Create a stable reference to the open function
  const handleFilePickerOpen = useCallback(() => {
    console.log('Opening file picker...', { openFunction: !!open, openType: typeof open });
    if (open) {
      try {
        open();
        console.log('File picker opened successfully');
      } catch (error) {
        console.error('Error opening file picker:', error);
      }
    } else {
      console.error('File picker open function not available');
    }
  }, [open]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateOutputFormat = (id: string, format: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, outputFormat: format } : f
    ));
  };

  const convertFiles = async () => {
    // Get files ready for conversion
    const filesToConvert = files.filter(f => f.status === 'pending' && f.outputFormat);

    setIsProcessing(true);
    const processor = new FileProcessor();

    for (const file of filesToConvert) {
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

        // Conversion completed successfully

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

  // Removed subscription/payment functions for desktop app

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      {/* Main Converter Card */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-0 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
        <CardContent className="p-8 relative">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              relative rounded-2xl p-12 text-center cursor-pointer
              transition-all duration-500 ease-out group
              ${isDragActive 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 scale-[1.02] border-blue-400' 
                : 'bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-900/30 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/50 dark:hover:to-gray-900/50 border-gray-300 dark:border-gray-700'
              }
              border-2 border-dashed hover:border-gray-400 dark:hover:border-gray-600
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Drop zone clicked!');
              handleFilePickerOpen();
            }}
          >
            <input {...getInputProps()} />

            <div className="relative z-10">
              <div className={`
                w-20 h-20 mx-auto mb-6 rounded-2xl
                flex items-center justify-center
                transition-all duration-500 ease-out
                ${isDragActive 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 rotate-12 scale-110 shadow-xl' 
                  : 'bg-gradient-to-br from-blue-400 to-indigo-500 group-hover:rotate-6 group-hover:scale-105 shadow-lg'
                }
              `}>
                <Upload className={`w-8 h-8 text-white transition-transform duration-500 ${isDragActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              </div>

              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Drop your files here!
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">Release to add them to the converter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Choose files to convert
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Drag & drop files here, or click to browse your device
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Browse Files button clicked!');
                        handleFilePickerOpen();
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                    >
                      Browse Files
                    </Button>

                    {/* Alternative file input as backup */}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="backup-file-input"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          console.log('Backup file input used:', files.map(f => f.name));
                          onDrop(files);
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        console.log('Backup Browse button clicked!');
                        document.getElementById('backup-file-input')?.click();
                      }}
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Browse (Backup)
                    </Button>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium shadow-sm">
                      <Image className="w-4 h-4" />
                      Images
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium shadow-sm">
                      <Video className="w-4 h-4" />
                      Videos
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-medium shadow-sm">
                      <Music className="w-4 h-4" />
                      Audio
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-orange-700 dark:text-orange-400 rounded-xl text-sm font-medium shadow-sm">
                      <FileText className="w-4 h-4" />
                      Documents
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Toggle */}
          {files.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="group px-6 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Settings className={`w-4 h-4 mr-2 transition-transform duration-300 ${showSettings ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-0 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Settings className="w-5 h-5" />
              </div>
              Conversion Settings
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Customize quality, dimensions, and other conversion parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ConversionSettings settings={settings} onSettingsChange={setSettings} />
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-0 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  Files to Convert
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1 font-semibold">
                    {files.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
                  Select output formats and convert your files
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={convertFiles}
                  disabled={isProcessing || files.every(f => !f.outputFormat)}
                  className="group relative px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {isProcessing ? (
                    <span className="relative flex items-center">
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Converting...
                    </span>
                  ) : (
                    <span className="relative flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Convert All
                    </span>
                  )}
                </Button>
                {files.some(f => f.status === 'completed') && (
                  <Button
                    variant="outline"
                    onClick={downloadAll}
                    className="px-6 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-4">
                {files.map((file, index) => {
                  const fileType = getFileType(file.file.name);
                  const availableFormats = SUPPORTED_FORMATS[fileType as keyof typeof SUPPORTED_FORMATS] || [];

                  return (
                    <Card 
                      key={file.id} 
                      className="group relative overflow-hidden bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-500 hover:scale-[1.01]"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          {/* File Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                              fileType === 'image' ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white' :
                              fileType === 'video' ? 'bg-gradient-to-br from-blue-400 to-cyan-600 text-white' :
                              fileType === 'audio' ? 'bg-gradient-to-br from-purple-400 to-pink-600 text-white' :
                              'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                            }`}>
                              {getFileIcon(fileType)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-lg">
                                {file.file.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <Badge
                                  className={`px-3 py-1 text-xs font-semibold rounded-xl ${
                                    fileType === 'image' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400' :
                                    fileType === 'video' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400' :
                                    fileType === 'audio' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400' :
                                    'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400'
                                  }`}
                                >
                                  {fileType.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-3">
                            <Select
                              value={file.outputFormat}
                              onValueChange={(format) => updateOutputFormat(file.id, format)}
                            >
                              <SelectTrigger className="w-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors duration-300 font-medium">
                                <SelectValue placeholder="Choose format" />
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
                                {availableFormats.map(format => (
                                  <SelectItem key={format} value={format} className="font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                                    .{format.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {file.status === 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => downloadFile(file)}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-4"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(file.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:rotate-90"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        {file.status === 'processing' && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                                Converting...
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                {file.progress}%
                              </span>
                            </div>
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${file.progress}%` }}
                              >
                                <div className="absolute inset-0 bg-white/30 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        )}

                        {file.status === 'error' && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-in slide-in-from-top-1 duration-300">
                            <p className="text-red-700 dark:text-red-300 text-sm font-bold flex items-center gap-2">
                              <span className="text-lg">⚠️</span> Conversion failed
                            </p>
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                              {file.error}
                            </p>
                          </div>
                        )}

                        {file.status === 'completed' && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-in slide-in-from-bottom-1 duration-300">
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
                              <span className="text-lg">✨</span> Conversion completed successfully
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Removed Payment Modal for desktop app */}

      {/* Removed Usage Limit Alerts for desktop app */}
    </div>
  );
}
