import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, UserRole } from "../models/UserModel";
import { UserRepository } from "../repository/UserRepository";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../config/ErrorHandler";

export interface AuthPayload {
  id: number;
  email: string;
  role: UserRole;
}

export class AuthService {
  private secret: string =
    process.env.JWT_SECRET || "sua-chave-secreta-super-segura";
  private expiresIn: string = process.env.JWT_EXPIRES_IN || "24h";
  private userRepository = new UserRepository();

  generateToken(payload: AuthPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as any,
    };
    return jwt.sign(payload, this.secret, options);
  }

  verifyToken(token: string): AuthPayload | null {
    try {
      const options: VerifyOptions = {};
      const decoded = jwt.verify(token, this.secret, options) as AuthPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError("Token inválido ou expirado");
    }
  }

  decodeToken(token: string): AuthPayload | null {
    try {
      const decoded = jwt.decode(token) as AuthPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError("Token inválido");
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  validatePassword(password: string): void {
    if (password.length < 6) {
      throw new ConflictError("A senha deve ter no mínimo 6 caracteres");
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    const { name, email, password, role = UserRole.CUSTOMER } = userData;

    this.validatePassword(password);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError("Email já está em uso");
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email, {
      attributes: { include: ["password"] },
    });

    if (!user) {
      throw new UnauthorizedError("Email ou senha incorretos");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Conta desativada");
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Email ou senha incorretos");
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async authenticate(token: string): Promise<AuthPayload> {
    const payload = this.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError("Token inválido ou expirado");
    }

    const user = await this.userRepository.findById(payload.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Usuário não encontrado ou conta desativada");
    }

    return payload;
  }

  authorize(requiredRole: UserRole, userRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 3,
      [UserRole.DELIVERY]: 2,
      [UserRole.CUSTOMER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  isDelivery(userRole: UserRole): boolean {
    return userRole === UserRole.DELIVERY;
  }

  isCustomer(userRole: UserRole): boolean {
    return userRole === UserRole.CUSTOMER;
  }
}
