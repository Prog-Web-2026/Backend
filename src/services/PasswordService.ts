import bcrypt from "bcryptjs";

export class PasswordService {
  private saltRounds = 10;

  // Hash de senha
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, salt);
  }

  // Comparar senha com hash
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
