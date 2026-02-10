import { UserRepository } from "../repository/UserRepository";
import { UserAttributes, UserRole, UserAddress } from "../models/UserModel";
import { AuthService } from "./AuthService";
import { GeolocationService } from "./GeolocationService";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../config/ErrorHandler";
import { Op } from "sequelize";

export class UserService {
  private userRepository = new UserRepository();
  private authService = new AuthService();
  private geolocationService = new GeolocationService();

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    address?: UserAddress;
    phone?: string;
  }) {
    return await this.authService.register(data);
  }

  async login(email: string, password: string) {
    const { user, token } = await this.authService.login(email, password);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        isActive: user.isActive,
      },
    };
  }

  async getAllUsers(
    currentUserRole: UserRole,
    filters?: {
      role?: UserRole;
      isActive?: boolean;
    }
  ) {
    if (!this.authService.isAdmin(currentUserRole)) {
      throw new ForbiddenError("Acesso negado");
    }

    const options: any = {};
    if (filters) {
      options.where = {};
      if (filters.role) options.where.role = filters.role;
      if (filters.isActive !== undefined)
        options.where.isActive = filters.isActive;
    }

    return await this.userRepository.findAll(options);
  }

  async getUserById(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole
  ) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!this.authService.isAdmin(currentUserRole) && currentUserId !== id) {
      throw new ForbiddenError("Acesso negado");
    }

    return user;
  }

  async updateUser(
    id: number,
    data: Partial<UserAttributes>,
    currentUserId: number,
    currentUserRole: UserRole
  ) {
    if (!this.authService.isAdmin(currentUserRole) && currentUserId !== id) {
      throw new ForbiddenError("Acesso negado");
    }

    if (data.role && !this.authService.isAdmin(currentUserRole)) {
      throw new ForbiddenError("Não é permitido alterar o perfil");
    }

    if (data.email) {
      const existingUser = await this.userRepository.findOne({
        where: {
          email: data.email,
          id: { [Op.ne]: id },
        },
      });
      if (existingUser) {
        throw new ValidationError("Email já está em uso");
      }
    }

    const affectedCount = await this.userRepository.update(id, data);

    if (affectedCount === 0) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return await this.userRepository.findById(id);
  }

  async updateUserAddress(
    userId: number,
    address: UserAddress,
    currentUserRole: UserRole
  ) {
    if (!this.authService.isCustomer(currentUserRole)) {
      throw new ForbiddenError("Apenas clientes podem atualizar endereço");
    }

    const fullAddress = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`;
    const coordinates =
      await this.geolocationService.geocodeAddress(fullAddress);

    const updatedAddress = {
      ...address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    const affectedCount = await this.userRepository.update(userId, {
      address: updatedAddress,
    });

    if (affectedCount === 0) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return await this.userRepository.findById(userId);
  }

  async deleteUser(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole
  ) {
    if (!this.authService.isAdmin(currentUserRole) && currentUserId !== id) {
      throw new ForbiddenError("Acesso negado");
    }

    const deletedCount = await this.userRepository.delete(id);

    if (deletedCount === 0) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return true;
  }

  async toggleUserStatus(
    id: number,
    currentUserRole: UserRole,
    isActive: boolean
  ) {
    if (!this.authService.isAdmin(currentUserRole)) {
      throw new ForbiddenError("Acesso negado");
    }

    const affectedCount = await this.userRepository.update(id, { isActive });

    if (affectedCount === 0) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return await this.userRepository.findById(id);
  }

  async getCurrentProfile(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return user;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.userRepository.findById(userId, {
      attributes: { include: ["password"] },
    });

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    const authService = new AuthService();
    const isCurrentPasswordValid = await authService.comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new ValidationError("Senha atual incorreta");
    }

    authService.validatePassword(newPassword);

    const hashedNewPassword = await authService.hashPassword(newPassword);

    const affectedCount = await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao alterar senha", 500);
    }

    return true;
  }
}
