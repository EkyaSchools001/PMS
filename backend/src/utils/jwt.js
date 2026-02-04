import jwt from 'jsonwebtoken';

export const generateToken = (userId, role) => {
    const secret = process.env.JWT_SECRET || globalThis.JWT_SECRET;
    if (!secret) {
        console.error('❌ CRITICAL: JWT_SECRET is not defined!');
        throw new Error('JWT_SECRET is missing');
    }
    return jwt.sign({ userId, role }, secret, {
        expiresIn: '7d',
    });
};

export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET || globalThis.JWT_SECRET;
    return jwt.verify(token, secret);
};
