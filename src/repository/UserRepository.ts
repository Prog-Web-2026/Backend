import { User } from "../models/UserModel";
import { PasswordService } from "../services/PasswordService";

const passwordService = new PasswordService();

export class UserRepository {
  async createUser(name: string, email: string, password: string) {
    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("Email já registrado");
    }

    // Hash de senha
    const hashedPassword = await passwordService.hashPassword(password);

    const user = await User.create({ name, email, password: hashedPassword });
    return user;
  }

  async getAllUsers() {
    return await User.findAll();
  }

  async getUserById(id: number) {
    return await User.findByPk(id);
  }

  async getUserByEmail(email: string) {
    return await User.findOne({ where: { email } });
  }

  async updateUser(id: number, data: Partial<User>) {
    const user = await User.findByPk(id);
    if (!user) return null;

    // Se a senha está sendo atualizada, fazer hash
    if (data.password) {
      data.password = await passwordService.hashPassword(data.password);
    }

    return await user.update(data);
  }

  async deleteUser(id: number) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.destroy();
    return user;
  }
}
