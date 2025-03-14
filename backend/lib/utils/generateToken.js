import jwt from "jsonwebtoken";

// Function to generate JWT and set it as HTTP-only cookie
export const generateTokenAndSetCookie = (userId, res) => {
  // Create JWT token with user ID payload
  const token = jwt.sign(
    { userId }, // Payload containing user identifier
    process.env.JWT_SECRET, // Secret key from environment variables
    { expiresIn: "15d" } // Token expiration (15 days)
  );

  // Set cookie in response header
  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // Cookie expiration (matches token expiration)
    httpOnly: true, // Prevent client-side JavaScript access
    sameSite: "strict", // Mitigate CSRF attacks
    secure: process.env.NODE_ENV !== "development", // HTTPS only in production
  });
};
