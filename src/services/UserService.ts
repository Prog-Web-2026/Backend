import { UserRepository } from "../repository/UserRepository";
import { UserCreationAttributes, UserAttributes } from "../models/UserModel";

const userRepo = new UserRepository();

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
}
