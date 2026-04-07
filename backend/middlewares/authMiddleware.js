const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");

const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true, cacheMaxAge: 600_000, // 10 min
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey,
      { algorithms: ["RS256"], issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}` },
      (err, decoded) => err ? reject(err) : resolve(decoded)
    );
  });
}


async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = await verifyAccessToken(token);   // decoded JWT payload
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token", detail: err.message });
  }
}

module.exports = authenticate;
