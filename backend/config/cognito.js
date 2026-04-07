const { CognitoIdentityProviderClient } = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

module.exports = { cognitoClient };
