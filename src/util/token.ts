import jwt from 'jsonwebtoken';
import { Request } from 'express';

// Generates a JSON Web Token (JWT) for both user an admin (since we have different type of users).
export const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret || !expiresIn) {
    throw new Error('JWT secret or expiration time not provided');
  }
  const token = jwt.sign({ id, role }, secret, { expiresIn });

  return token;
};

export const signRefreshToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

  if (!secret || !expiresIn) {
    throw new Error('JWT secret or expiration time not provided');
  }

  const refreshToken = jwt.sign({ id, role }, secret, { expiresIn });

  return refreshToken;

}



export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret not provided');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error(error);
    throw new Error('Invalid token');
  }
};

export const generateVerificationCode = (): number => {
  return Math.floor(1000 + Math.random() * 9000);
}