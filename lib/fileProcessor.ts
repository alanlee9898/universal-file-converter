import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import imageCompression from 'browser-image-compression';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export class FileProcessor {
  private ffmpeg: FFmpeg | null = null;
  private ffmpegLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  private async loadFFmpeg() {
    if (this.ffmpegLoaded) return;

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    this.ffmpeg!.on('log', ({ message }) => {
      console.log(message);
    });

    await this.ffmpeg!.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.ffmpegLoaded = true;
  }

  async convertFile(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const fileType = this.getFileType(file.name);
    
    onProgress?.(10);

    switch (fileType) {
      case 'image':
        return this.convertImage(file, outputFormat, settings, onProgress);
      case 'video':
        return this.convertVideo(file, outputFormat, settings, onProgress);
      case 'audio':
        return this.convertAudio(file, outputFormat, settings, onProgress);
      case 'document':
        return this.convertDocument(file, outputFormat, settings, onProgress);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async convertImage(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    onProgress?.(20);

    // Handle SVG separately
    if (file.type === 'image/svg+xml') {
      return this.convertSVG(file, outputFormat, settings, onProgress);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          onProgress?.(40);

          // Set canvas dimensions
          let { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            settings.width,
            settings.height,
            settings.maintainAspectRatio
          );

          canvas.width = width;
          canvas.height = height;

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          onProgress?.(70);

          // Convert to blob
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'));
                return;
              }

              onProgress?.(90);

              // Apply compression if needed
              if (settings.quality < 100 && (outputFormat === 'jpg' || outputFormat === 'jpeg' || outputFormat === 'webp')) {
                try {
                  const compressedBlob = await imageCompression(new File([blob], 'temp'), {
                    maxSizeMB: Infinity,
                    maxWidthOrHeight: Math.max(width, height),
                    useWebWorker: true,
                    initialQuality: settings.quality / 100
                  });
                  onProgress?.(100);
                  resolve(compressedBlob);
                } catch (error) {
                  onProgress?.(100);
                  resolve(blob);
                }
              } else {
                onProgress?.(100);
                resolve(blob);
              }
            },
            this.getMimeType(outputFormat),
            settings.quality / 100
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private async convertSVG(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const svgText = await file.text();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width || 800,
          img.height || 600,
          settings.width,
          settings.height,
          settings.maintainAspectRatio
        );

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              onProgress?.(100);
              resolve(blob);
            } else {
              reject(new Error('Failed to convert SVG'));
            }
          },
          this.getMimeType(outputFormat),
          settings.quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load SVG'));
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    });
  }

  private async convertVideo(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.loadFFmpeg();
    onProgress?.(30);

    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg!.writeFile(inputName, await fetchFile(file));
    onProgress?.(50);

    // Build FFmpeg command
    const args = ['-i', inputName];

    // Add quality settings
    if (outputFormat === 'mp4') {
      args.push('-c:v', 'libx264', '-crf', String(Math.round((100 - settings.quality) * 0.51)));
    }

    // Add dimension settings
    if (settings.width > 0 || settings.height > 0) {
      const scale = settings.maintainAspectRatio 
        ? `${settings.width || -1}:${settings.height || -1}`
        : `${settings.width}:${settings.height}`;
      args.push('-vf', `scale=${scale}`);
    }

    args.push(outputName);

    // Set up progress tracking
    this.ffmpeg!.on('progress', ({ progress }) => {
      onProgress?.(50 + (progress * 40));
    });

    await this.ffmpeg!.exec(args);
    onProgress?.(95);

    const data = await this.ffmpeg!.readFile(outputName); const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
    onProgress?.(100);

    return new Blob([new Uint8Array(dataArray.buffer.slice(dataArray.byteOffset, dataArray.byteOffset + dataArray.byteLength))], { type: this.getMimeType(outputFormat) });
  }

  private async convertAudio(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.loadFFmpeg();
    onProgress?.(30);

    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg!.writeFile(inputName, await fetchFile(file));
    onProgress?.(50);

    const args = ['-i', inputName];

    // Add quality settings
    if (outputFormat === 'mp3') {
      const bitrate = Math.round(settings.quality * 3.2); // 0-320 kbps
      args.push('-b:a', `${bitrate}k`);
    }

    args.push(outputName);

    this.ffmpeg!.on('progress', ({ progress }) => {
      onProgress?.(50 + (progress * 40));
    });

    await this.ffmpeg!.exec(args);
    onProgress?.(95);

    const data = await this.ffmpeg!.readFile(outputName); const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
    onProgress?.(100);

    return new Blob([new Uint8Array(dataArray.buffer.slice(dataArray.byteOffset, dataArray.byteOffset + dataArray.byteLength))], { type: this.getMimeType(outputFormat) });
  }

  private async convertDocument(
    file: File,
    outputFormat: string,
    settings: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const inputFormat = file.name.split('.').pop()?.toLowerCase();
    onProgress?.(30);

    switch (inputFormat) {
      case 'docx':
        return this.convertDocx(file, outputFormat, onProgress);
      case 'xlsx':
        return this.convertXlsx(file, outputFormat, onProgress);
      case 'pdf':
        return this.convertPdf(file, outputFormat, onProgress);
      case 'txt':
        return this.convertTxt(file, outputFormat, onProgress);
      default:
        throw new Error(`Unsupported document format: ${inputFormat}`);
    }
  }

  private async convertDocx(
    file: File,
    outputFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(50);

    if (outputFormat === 'html') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      onProgress?.(90);
      const blob = new Blob([result.value], { type: 'text/html' });
      onProgress?.(100);
      return blob;
    } else if (outputFormat === 'txt') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      onProgress?.(90);
      const blob = new Blob([result.value], { type: 'text/plain' });
      onProgress?.(100);
      return blob;
    }

    throw new Error(`Cannot convert DOCX to ${outputFormat}`);
  }

  private async convertXlsx(
    file: File,
    outputFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    onProgress?.(60);

    if (outputFormat === 'csv') {
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      onProgress?.(90);
      const blob = new Blob([csv], { type: 'text/csv' });
      onProgress?.(100);
      return blob;
    } else if (outputFormat === 'html') {
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const html = XLSX.utils.sheet_to_html(worksheet);
      onProgress?.(90);
      const blob = new Blob([html], { type: 'text/html' });
      onProgress?.(100);
      return blob;
    }

    throw new Error(`Cannot convert XLSX to ${outputFormat}`);
  }

  private async convertPdf(
    file: File,
    outputFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (outputFormat === 'txt') {
      // For PDF to text conversion, we'd need a PDF parsing library
      // This is a simplified version
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      onProgress?.(70);
      
      // This is a placeholder - actual PDF text extraction would require additional libraries
      const text = `PDF content extraction not fully implemented. File has ${pdfDoc.getPageCount()} pages.`;
      const blob = new Blob([text], { type: 'text/plain' });
      onProgress?.(100);
      return blob;
    }

    throw new Error(`Cannot convert PDF to ${outputFormat}`);
  }

  private async convertTxt(
    file: File,
    outputFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const text = await file.text();
    onProgress?.(60);

    if (outputFormat === 'html') {
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Converted Document</title>
</head>
<body>
    <pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
      onProgress?.(90);
      const blob = new Blob([html], { type: 'text/html' });
      onProgress?.(100);
      return blob;
    } else if (outputFormat === 'csv') {
      // Convert text to CSV (assuming line-separated values)
      const lines = text.split('\n');
      const csv = lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
      onProgress?.(90);
      const blob = new Blob([csv], { type: 'text/csv' });
      onProgress?.(100);
      return blob;
    }

    throw new Error(`Cannot convert TXT to ${outputFormat}`);
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number,
    maintainAspectRatio: boolean
  ) {
    if (!targetWidth && !targetHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (!maintainAspectRatio) {
      return {
        width: targetWidth || originalWidth,
        height: targetHeight || originalHeight
      };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (targetWidth && targetHeight) {
      const targetAspectRatio = targetWidth / targetHeight;
      if (aspectRatio > targetAspectRatio) {
        return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
      } else {
        return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
      }
    } else if (targetWidth) {
      return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
    } else {
      return { width: Math.round(targetHeight! * aspectRatio), height: targetHeight! };
    }
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const formats = {
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'],
      video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
      audio: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'],
      document: ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'html']
    };

    for (const [type, exts] of Object.entries(formats)) {
      if (exts.includes(ext)) return type;
    }
    return 'unknown';
  }

  private getMimeType(format: string): string {
    const mimeTypes: { [key: string]: string } = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      svg: 'image/svg+xml',
      
      // Videos
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      flv: 'video/x-flv',
      wmv: 'video/x-ms-wmv',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      
      // Documents
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      html: 'text/html'
    };

    return mimeTypes[format] || 'application/octet-stream';
  }
}
