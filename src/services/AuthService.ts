import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

export interface AuthPayload {
  id: number;
  email: string;
}

export class AuthService {
  private secret: string = process.env.JWT_SECRET || "sua-chave-secreta-super-segura";
  private expiresIn: string = process.env.JWT_EXPIRES_IN || "24h";

  // Gerar token JWT
  generateToken(payload: AuthPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as any,
    };
    return jwt.sign(payload, this.secret, options);
  }

  // Verificar token JWT
  verifyToken(token: string): AuthPayload | null {
    try {
      const options: VerifyOptions = {};
      const decoded = jwt.verify(token, this.secret, options) as AuthPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Decodificar token sem verificar (para debugging)
  decodeToken(token: string): AuthPayload | null {
    try {
      const decoded = jwt.decode(token) as AuthPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
