const {
  SignUpCommand, InitiateAuthCommand,
  ConfirmSignUpCommand, ResendConfirmationCodeCommand,
  GlobalSignOutCommand, ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("jsonwebtoken");

const { cognitoClient } = require("../config/cognito");
const User = require("../models/User");

exports.signup = async (req, res) => {
  const { name, email, password, address } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "name, email and password are required" });

  if (password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  try {
    const userAttributes = [
      { Name: "email", Value: email },
      { Name: "name",  Value: name  },
    ];
    
    if (address) {
      userAttributes.push({ Name: "address", Value: address });
    }

    const cmd = new SignUpCommand({
      ClientId:   process.env.COGNITO_CLIENT_ID,
      Username:   name, // Use the username (name) instead of email
      Password:   password,
      UserAttributes: userAttributes,
    });

    const result = await cognitoClient.send(cmd);
    const cognitoSub = result.UserSub;

    // Pre-create user in MongoDB (verified=false until OTP confirmed)
    await User.findOneAndUpdate(
      { cognitoSub },
      { cognitoSub, email, name, verified: false },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: "Signup successful. Check your email for the verification code.",
      userSub: cognitoSub,
      deliveryMedium: result.CodeDeliveryDetails?.DeliveryMedium,
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.name === "UsernameExistsException")
      return res.status(409).json({ message: "An account with this email already exists" });
    res.status(500).json({ message: err.message });
  }
};

exports.verify = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: "email and code are required" });

  try {
    // Lookup the internal Cognito Username (which we saved as 'name' during signup)
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await cognitoClient.send(new ConfirmSignUpCommand({
      ClientId:         process.env.COGNITO_CLIENT_ID,
      Username:         user.name, 
      ConfirmationCode: code,
    }));

    user.verified = true;
    await user.save();

    res.json({ message: "Email verified successfully. You can now sign in." });
  } catch (err) {
    console.error("Verify error:", err);
    if (err.name === "CodeMismatchException")
      return res.status(400).json({ message: "Incorrect verification code" });
    if (err.name === "ExpiredCodeException")
      return res.status(400).json({ message: "Code expired — request a new one" });
    res.status(500).json({ message: err.message });
  }
};

exports.resend = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await cognitoClient.send(new ResendConfirmationCodeCommand({
      ClientId:   process.env.COGNITO_CLIENT_ID,
      Username:   user.name,
    }));
    res.json({ message: "Verification code resent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email and password are required" });

  try {
    const result = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow:       "USER_PASSWORD_AUTH",
      ClientId:       process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME:    email,
        PASSWORD:    password,
      },
    }));

    const { AccessToken, IdToken, RefreshToken } = result.AuthenticationResult;

    // Decode idToken to get sub + name
    const idPayload = jwt.decode(IdToken);

    // Upsert user in MongoDB on every login
    const mongoUser = await User.findOneAndUpdate(
      { cognitoSub: idPayload.sub },
      {
        cognitoSub: idPayload.sub,
        email,
        name: idPayload.name || idPayload["cognito:username"],
        verified: true,
        lastLogin: new Date(),
        $inc: { loginCount: 1 },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Login successful",
      accessToken:  AccessToken,
      idToken:      IdToken,
      refreshToken: RefreshToken,
      user: {
        id:    mongoUser._id,
        sub:   idPayload.sub,
        email: mongoUser.email,
        name:  mongoUser.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    if (["NotAuthorizedException", "UserNotFoundException"].includes(err.name))
      return res.status(401).json({ message: "Incorrect email or password" });
    if (err.name === "UserNotConfirmedException")
      return res.status(403).json({ message: "Please verify your email first" });
    res.status(500).json({ message: err.message });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken, email } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });

  try {
    const result = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow:  "REFRESH_TOKEN_AUTH",
      ClientId:  process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    }));

    res.json({
      accessToken: result.AuthenticationResult.AccessToken,
      idToken:     result.AuthenticationResult.IdToken,
    });
  } catch (err) {
    res.status(401).json({ message: "Session expired — please sign in again" });
  }
};

exports.logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: token }));
    res.json({ message: "Signed out from all devices" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await cognitoClient.send(new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: user.name
    }));
    res.json({ message: "Password reset code sent to email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) 
    return res.status(400).json({ message: "email, code, and newPassword are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await cognitoClient.send(new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: user.name,
      ConfirmationCode: code,
      Password: newPassword
    }));
    res.json({ message: "Password has been successfully reset. You can now login." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
