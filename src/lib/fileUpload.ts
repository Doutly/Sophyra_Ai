import { supabase } from './supabase';

const CHUNK_SIZE = 1024 * 1024;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
}

export class OptimizedFileUploader {
  private startTime: number = 0;
  private lastLoaded: number = 0;
  private lastTime: number = 0;

  async uploadWithProgress(
    file: File,
    bucket: string,
    path: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { onProgress, onComplete, onError, chunkSize = CHUNK_SIZE } = options;

    this.startTime = Date.now();
    this.lastTime = this.startTime;
    this.lastLoaded = 0;

    try {
      if (file.size <= chunkSize) {
        return await this.uploadDirect(file, bucket, path, onProgress);
      }

      return await this.uploadChunked(file, bucket, path, chunkSize, onProgress);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  private async uploadDirect(
    file: File,
    bucket: string,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const currentTime = Date.now();
          const timeDiff = (currentTime - this.lastTime) / 1000;
          const loadedDiff = e.loaded - this.lastLoaded;
          const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
          const timeRemaining = speed > 0 ? (e.total - e.loaded) / speed : 0;

          this.lastTime = currentTime;
          this.lastLoaded = e.loaded;

          onProgress?.({
            loaded: e.loaded,
            total: e.total,
            percentage: (e.loaded / e.total) * 100,
            speed,
            timeRemaining,
          });
        }
      });

      supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: file.type || 'application/pdf',
          cacheControl: '3600',
          upsert: false
        })
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

          resolve(publicUrl);
        })
        .catch(reject);
    });
  }

  private async uploadChunked(
    file: File,
    bucket: string,
    path: string,
    chunkSize: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedSize = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end, file.type);

      const chunkPath = `${path}.part${i}`;
      const { error: chunkError } = await supabase.storage
        .from(bucket)
        .upload(chunkPath, chunk, {
          contentType: file.type || 'application/pdf',
          cacheControl: '3600',
          upsert: true
        });

      if (chunkError) {
        console.error(`Chunk ${i} upload failed:`, chunkError);
        for (let j = 0; j < i; j++) {
          await supabase.storage.from(bucket).remove([`${path}.part${j}`]).catch(() => {});
        }
        throw chunkError;
      }

      uploadedSize += chunk.size;

      const currentTime = Date.now();
      const timeDiff = (currentTime - this.lastTime) / 1000;
      const loadedDiff = uploadedSize - this.lastLoaded;
      const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
      const timeRemaining = speed > 0 ? (file.size - uploadedSize) / speed : 0;

      this.lastTime = currentTime;
      this.lastLoaded = uploadedSize;

      onProgress?.({
        loaded: uploadedSize,
        total: file.size,
        percentage: (uploadedSize / file.size) * 100,
        speed,
        timeRemaining,
      });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type || 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${path}.part${i}`;
      await supabase.storage.from(bucket).remove([chunkPath]).catch(() => {});
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
}

export const fileUploader = new OptimizedFileUploader();

export async function optimizeImageBeforeUpload(file: File, maxWidth: number = 1920): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const { maxSize = 15 * 1024 * 1024, allowedTypes = [] } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${fileUploader.formatBytes(maxSize)}`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
