const express = require("express");
const { getProtected, getMe } = require("../controllers/userController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

router.get("/protected", getProtected);
router.get("/me", getMe);

module.exports = router;
