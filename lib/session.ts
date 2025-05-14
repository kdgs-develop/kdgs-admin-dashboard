import { SessionOptions } from "iron-session";

declare module "iron-session" {
  interface IronSessionData {
    userId?: string;
    isLoggedIn?: boolean;
    guestId?: string; // Add optional guest ID
  }
}

// Define the structure of your session data
export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
  displayName?: string;
  guestId?: string; // Add optional guest ID
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string, // MUST be set in your .env! Min 32 chars.
  cookieName: "kdgs-session", // Choose a unique name
  // secure: true should be used in production (HTTPS)
  // You might need different settings for development and production environments
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" // Adjust as needed (lax is usually good)
    // maxAge: 60 * 60 * 24 * 7 // Optional: Set cookie expiry (e.g., 7 days)
  }
};

// Ensure SESSION_SECRET is set
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET environment variable is not set or is too short (must be at least 32 characters)."
  );
}
 