import * as jose from "jose";

export const buildJwt = async ({ id, email, role }) => {
  const raw_payload = {
    id: id,
    email: email,
    role: role,
  };

  const secret = new TextEncoder().encode(process.env.SECRET); // For HS256

  const jwt = await new jose.SignJWT(raw_payload)
    .setProtectedHeader({ alg: "HS256", authenticated: true }) // Algorithm MUST
    .setIssuedAt()
    .setExpirationTime("2d") // exp
    .sign(secret);

  return jwt;
};

export const verifyAuth = async (jwt) => {
  const secret = new TextEncoder().encode(process.env.SECRET); // For HS256
  const { payload, protectedHeader } = await jose.jwtVerify(jwt, secret);

  return {
    authenticated: protectedHeader.authenticated || false,
    id: payload.id || null,
    email: payload.email || null,
    role: payload.role || null,
  };
};
