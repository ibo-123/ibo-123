import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class FileService {
  private static readonly UPLOAD_DIR = 'uploads';

  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    userId: string,
    type: 'profile' | 'license' | 'logo'
  ): Promise<string> {
    await this.ensureUploadDir();

    const extension = path.extname(originalName);
    const filename = `${userId}-${type}-${uuidv4()}${extension}`;
    const filepath = path.join(this.UPLOAD_DIR, filename);

    await fs.writeFile(filepath, fileBuffer);

    return `/uploads/${filename}`;
  }

  static async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    
    const filename = path.basename(fileUrl);
    const filepath = path.join(this.UPLOAD_DIR, filename);
    
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.warn('File deletion failed:', error);
    }
  }

  static validateFile(file: Express.Multer.File, maxSizeMB = 5): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
    }

    return { valid: true };
  }
}
