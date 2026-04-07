const express = require("express");
const { signup, verify, resend, login, refresh, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", verify);
router.post("/resend", resend);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
