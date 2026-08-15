import fs from "node:fs/promises";
import path from "node:path";
export interface Storage {
  save(file: Express.Multer.File): Promise<string>;
  remove(filePath: string): Promise<void>;
}
export class LocalStorage implements Storage {
  constructor(private directory = process.env.UPLOAD_DIR ?? "uploads") {}
  async save(file: Express.Multer.File) {
    await fs.mkdir(this.directory, { recursive: true });
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    await fs.writeFile(path.join(this.directory, safeName), file.buffer);
    return `/uploads/${safeName}`;
  }
  async remove(filePath: string) {
    try {
      await fs.unlink(path.join(this.directory, path.basename(filePath)));
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
export const storage: Storage = new LocalStorage();
