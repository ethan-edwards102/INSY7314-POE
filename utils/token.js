import jwt from 'jsonwebtoken'

export const signToken = (user) => {
    const payload = {
        id: user._id.toString(),
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET)
