import express from "express";
import {
  loginUser,
  logout,
  registerUser,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middlerware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);

router.post("/login", loginUser);
router.post("/logout", logout);

router.get("/profile", requireAuth, (req, res) => {
  res.json({ username: req.user.username, email: req.user.email });
});
router.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: `Welcome to dashboard, ${req.user.username}` });
});

export default router;
