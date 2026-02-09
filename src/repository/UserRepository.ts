import { FindOptions } from "sequelize";
import {
  User,
  UserAttributes,
  UserCreationAttributes,
  UserRole,
} from "../models/UserModel";

export class UserRepository {
  async create(data: UserCreationAttributes): Promise<User> {
    return await User.create(data);
  }

  async findAll(options?: FindOptions): Promise<User[]> {
    return await User.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<User | null> {
    return await User.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<User | null> {
    return await User.findOne(options);
  }

  async findByEmail(
    email: string,
    options?: FindOptions,
  ): Promise<User | null> {
    return await User.findOne({
      where: { email },
      ...options,
    });
  }

  async update(id: number, data: Partial<UserAttributes>): Promise<number> {
    const [affectedCount] = await User.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await User.destroy({
      where: { id },
    });
  }

  async findDeliveryPersons(options?: FindOptions): Promise<User[]> {
    return await User.findAll({
      where: {
        role: UserRole.DELIVERY,
        isActive: true,
      },
      ...options,
    });
  }
}
