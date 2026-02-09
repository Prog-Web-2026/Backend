import { UserRole } from "../models/UserModel";
import { UserService } from "../services/UserService";

export async function seedAdmin() {
  const userService = new UserService();

  try {
    const admins = await userService.getAllUsers(UserRole.ADMIN, {
      role: UserRole.ADMIN,
    });
    if (admins.length > 0) {
      console.log("Admin já existe. Nenhuma ação necessária.");
      return;
    }

    const admin = await userService.register({
      name: process.env.ADMIN_NAME || "Admin",
      email: process.env.ADMIN_EMAIL || "admin@exemplo.com",
      password: process.env.ADMIN_PASSWORD || "senha123",
      role: UserRole.ADMIN,
    });

    console.log("Admin criado automaticamente:", admin.user.email);
  } catch (err) {
    console.error("Erro ao criar admin automático:", err);
  }
}
