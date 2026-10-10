import jwt from 'jsonwebtoken'

export const signToken = (user) => {
    const payload = {
        id: user._id.toString(),
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

// Accept only HS256, so a token cannot choose a different algorithm in its header.
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })

/* ref
https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
https://datatracker.ietf.org/doc/html/rfc8725#section-3.1
*/
