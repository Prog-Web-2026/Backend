import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { AppError, ValidationError } from "../config/ErrorHandler";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  filename: string;
  path: string;
  size: number;
}

export class FileUploadService {
  private uploadDir: string;
  private allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads");
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private generateFilename(originalname: string): string {
    const extension = path.extname(originalname);
    return `${randomUUID()}${extension}`;
  }

  private fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ): void {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new ValidationError(
          "Tipo de arquivo não permitido. Apenas imagens JPEG, PNG, GIF e WebP são aceitas.",
        ),
      );
    }

    if (file.size > this.maxFileSize) {
      return cb(
        new ValidationError("Arquivo muito grande. O tamanho máximo é 5MB."),
      );
    }

    cb(null, true);
  }

  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, this.uploadDir);
    },
    filename: (req, file, cb) => {
      const filename = this.generateFilename(file.originalname);
      cb(null, filename);
    },
  });

  getUploadMiddleware() {
    return multer({
      storage: this.storage,
      fileFilter: (req, file, cb) => this.fileFilter(req, file, cb),
      limits: {
        fileSize: this.maxFileSize,
      },
    });
  }

  async uploadSingle(
    fieldName: string,
  ): Promise<(req: Request, res: any, next: any) => void> {
    return this.getUploadMiddleware().single(fieldName);
  }

  async uploadMultiple(
    fieldName: string,
    maxCount: number = 5,
  ): Promise<(req: Request, res: any, next: any) => void> {
    return this.getUploadMiddleware().array(fieldName, maxCount);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Erro ao excluir arquivo ${filename}:`, error);
      throw new AppError("Erro ao excluir arquivo", 500);
    }
  }

  getFileUrl(filename: string): string {
    if (!filename) {
      return "";
    }
    return `/uploads/${filename}`;
  }

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new ValidationError("Nenhum arquivo enviado");
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new ValidationError("Tipo de arquivo não permitido");
    }

    if (file.size > this.maxFileSize) {
      throw new ValidationError("Arquivo muito grande");
    }
  }

  async processAndSaveBase64Image(
    base64Data: string,
    prefix: string = "img",
  ): Promise<string> {
    try {
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        throw new ValidationError("Formato base64 de imagem inválido");
      }

      const mimeType = matches[1];
      const base64Image = matches[2];

      const allowedMimeTypes = ["jpeg", "jpg", "png", "gif", "webp"];
      if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
        throw new ValidationError(`Tipo de imagem não suportado: ${mimeType}`);
      }

      const buffer = Buffer.from(base64Image, "base64");

      if (buffer.length > this.maxFileSize) {
        throw new ValidationError("Imagem muito grande");
      }

      const extension = mimeType === "jpg" ? "jpeg" : mimeType;
      const filename = this.generateFilename(`${prefix}.${extension}`);
      const filePath = path.join(this.uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      return filename;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Erro ao processar imagem base64", 500);
    }
  }
}
