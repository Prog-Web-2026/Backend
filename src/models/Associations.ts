// Este arquivo importa todos os models na ordem correta para garantir
// que as associações sejam definidas corretamente.
// A ordem de importação é importante para evitar dependências circulares.

// Models base (sem dependências)
import "./UserModel";
import "./CategoryModel";

// Models com dependência de Category
import "./ProductModel";

// Models com dependência de User
import "./OrderModel";

// Models com dependência de Order e Product
import "./OrderItemModel";

// Models com dependência de Order e User
import "./PaymentModel";

// Models N:N (User <-> Product)
import "./CartModel";
import "./ProductReviewModel";

// Re-exporta todos os models para facilitar imports
export { User, UserRole } from "./UserModel";
export { Category } from "./CategoryModel";
export { Product } from "./ProductModel";
export { Order, OrderStatus } from "./OrderModel";
export { OrderItem } from "./OrderItemModel";
export { Payment, PaymentStatus, PaymentType } from "./PaymentModel";
export { Cart } from "./CartModel";
export { ProductReview } from "./ProductReviewModel";
