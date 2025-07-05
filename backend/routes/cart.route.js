import express from "express";
import {
  protectRoute,
  getCartProducts,
  removeAllFromCart,
  updateQuantity,
} from "../middleware/auth.middleware";
import { addToCart } from "../controllers/cart.controller";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute , addToCart);
router.delete("/", protectRoute , removeAllFromCart);
router.put("/:id", protectRoute , updateQuantity);

export default router;