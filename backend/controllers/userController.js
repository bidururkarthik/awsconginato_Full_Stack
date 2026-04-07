const User = require("../models/User");

exports.getProtected = async (req, res) => {
  // req.user is the decoded JWT payload from Cognito
  const dbUser = await User.findOne({ cognitoSub: req.user.sub }).lean();
  res.json({
    message: "Access granted ✓",
    cognitoClaims: {
      sub:      req.user.sub,
      email:    req.user.email,
      username: req.user["cognito:username"],
      groups:   req.user["cognito:groups"] || [],
      tokenUse: req.user.token_use,
      expiry:   new Date(req.user.exp * 1000).toISOString(),
    },
    mongoProfile: dbUser || null,
  });
};

exports.getMe = async (req, res) => {
  const user = await User.findOne({ cognitoSub: req.user.sub }).select("-__v").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};
