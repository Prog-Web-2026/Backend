import { User, UserRole } from "../models/UserModel";
import { Category } from "../models/CategoryModel";
import { Product } from "../models/ProductModel";
import { AuthService } from "../services/AuthService";

declare global {
  var testAdmin: User;
  var testCustomer: User;
  var testDelivery: User;
  var testCategory: Category;
  var testProduct1: Product;
  var testProduct2: Product;
  var authService: AuthService;
}

export {};
