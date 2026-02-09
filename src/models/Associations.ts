import { associateOrder } from "./OrderModel";
import { associatePayment } from "./PaymentModel";

export const setupAssociations = () => {
  associatePayment();
  associateOrder();
};
