import JWT, { SignOptions } from "jsonwebtoken";

export const generateToken = (
  userInfo: object | string,
  secretSignature: string,
  tokenLife: string,
) => {
  const signOptions: SignOptions = {
    algorithm: "HS256",
    expiresIn: tokenLife as SignOptions["expiresIn"],
  };
  return JWT.sign(userInfo, secretSignature, signOptions);
};

export const verifyToken = (token: string, secretSignature: string) => {
  return JWT.verify(token, secretSignature);
};
