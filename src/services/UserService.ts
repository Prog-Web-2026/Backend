import { UserRepository } from "../repository/UserRepository";
import { UserCreationAttributes, UserAttributes } from "../models/UserModel";
import { PasswordService } from "./PasswordService";
import { AuthService, AuthPayload } from "./AuthService";

const userRepo = new UserRepository();
const passwordService = new PasswordService();
const authService = new AuthService();

export class UserService {
  async create(data: UserCreationAttributes) {
    return await userRepo.createUser(data.name, data.email, data.password);
  }

  async getAll() {
    return await userRepo.getAllUsers();
  }

  async getById(id: number) {
    return await userRepo.getUserById(id);
  }

  async update(id: number, data: Partial<UserAttributes>) {
    return await userRepo.updateUser(id, data);
  }

  async delete(id: number) {
    return await userRepo.deleteUser(id);
  }

  // Login - Autenticar usuário
  async login(email: string, password: string) {
    // Buscar usuário por email
    const user = await userRepo.getUserByEmail(email);
    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    // Comparar senha
    const isPasswordValid = await passwordService.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Email ou senha incorretos");
    }

    // Gerar token JWT
    const payload: AuthPayload = {
      id: user.id,
      email: user.email,
    };
    const token = authService.generateToken(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
