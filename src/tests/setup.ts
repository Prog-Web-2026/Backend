// Importa todos os models na ordem correta
import "../models/Associations";

import sequelize from "../config/database";
import { Category } from "../models/CategoryModel";
import { Product } from "../models/ProductModel";
import { User, UserRole } from "../models/UserModel";
import { AuthService } from "../services/AuthService";

const authServiceInstance = new AuthService();

declare global {
  var testAdmin: User;
  var testCustomer: User;
  var testDelivery: User;
  var testCategory: Category;
  var testProduct1: Product;
  var testProduct2: Product;
  var authService: AuthService;
  var getAuthToken: (user: User) => Promise<string>;
}

export const createTestUser = async (
  role: UserRole = UserRole.CUSTOMER,
  email?: string
) => {
  return User.create({
    name: `Test ${role}`,
    email: email || `test.${role.toLowerCase()}@example.com`,
    password: await authServiceInstance.hashPassword("password123"),
    role,
    isActive: true,
    address: {
      street: "Rua Teste",
      number: "123",
      neighborhood: "Bairro Teste",
      city: "Cidade Teste",
      state: "TS",
      zipCode: "12345678",
      latitude: -23.5505,
      longitude: -46.6333,
    },
    phone: "11999999999",
  });
};

export const getAuthToken = async (user: User) => {
  return authServiceInstance.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

beforeAll(async () => {
  global.authService = authServiceInstance;
  global.getAuthToken = getAuthToken;

  await sequelize.sync({ force: true });

  global.testAdmin = await createTestUser(UserRole.ADMIN, "admin@example.com");
  global.testCustomer = await createTestUser(
    UserRole.CUSTOMER,
    "customer@example.com"
  );
  global.testDelivery = await createTestUser(
    UserRole.DELIVERY,
    "delivery@example.com"
  );

  global.testCategory = await Category.create({
    name: "Eletrônicos",
    description: "Produtos eletrônicos",
    isActive: true,
  });

  global.testProduct1 = await Product.create({
    name: "Smartphone Teste",
    description: "Smartphone de teste",
    price: 1999.99,
    stock: 10,
    categoryId: global.testCategory.id,
    isActive: true,
  });

  global.testProduct2 = await Product.create({
    name: "Notebook Teste",
    description: "Notebook de teste",
    price: 4999.99,
    stock: 5,
    categoryId: global.testCategory.id,
    isActive: true,
  });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  const models = ["Payment", "OrderItem", "Order", "Cart", "ProductReview"];

  for (const modelName of models) {
    const model = sequelize.models[modelName];
    if (model) await model.destroy({ where: {}, force: true });
  }
});
