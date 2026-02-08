import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

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
    path: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { onProgress, onComplete, onError } = options;

    this.startTime = Date.now();
    this.lastTime = this.startTime;
    this.lastLoaded = 0;

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/pdf',
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const currentTime = Date.now();
            const timeDiff = (currentTime - this.lastTime) / 1000;
            const loadedDiff = snapshot.bytesTransferred - this.lastLoaded;
            const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
            const timeRemaining = speed > 0 ? (snapshot.totalBytes - snapshot.bytesTransferred) / speed : 0;

            this.lastTime = currentTime;
            this.lastLoaded = snapshot.bytesTransferred;

            onProgress?.({
              loaded: snapshot.bytesTransferred,
              total: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              speed,
              timeRemaining,
            });
          },
          (error) => {
            onError?.(error as Error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onComplete?.(downloadURL);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
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
