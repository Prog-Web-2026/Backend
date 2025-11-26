import { User } from "../models/UserModel";

export class UserRepository {
  async createUser(name: string, email: string, password: string) {
    const user = await User.create({ name, email, password });
    return user;
  }

  async getAllUsers() {
    return await User.findAll();
  }

  async getUserById(id: number) {
    return await User.findByPk(id);
  }

  async updateUser(id: number, data: Partial<User>) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update(data);
  }

  async deleteUser(id: number) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.destroy();
    return user;
  }
}
