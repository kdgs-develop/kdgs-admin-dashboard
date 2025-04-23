"use server";

import { z } from "zod";
// Assuming iron-session setup
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session"; // Your session config
import { cookies } from "next/headers";

const LoginSchema = z.object({
  // WordPress JWT plugin usually expects 'username', which can be email or username
  username: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required")
});

export async function login(
  formData: unknown
): Promise<{ success: boolean; error?: string }> {
  const validation = LoginSchema.safeParse(formData);
  if (!validation.success) {
    // Combine Zod error messages for better feedback
    const errorMessages = validation.error.errors
      .map(e => e.message)
      .join(", ");
    return { success: false, error: `Invalid input: ${errorMessages}` };
  }

  const { username, password } = validation.data;
  // Default JWT endpoint - VERIFY THIS in your WP plugin settings
  const wordpressJwtUrl =
    process.env.WORDPRESS_JWT_API_URL ||
    "https://kdgs.ca/wp-json/jwt-auth/v1/token";

  try {
    console.log(`Attempting login for ${username} via ${wordpressJwtUrl}`);
    const response = await fetch(wordpressJwtUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Body structure expected by the JWT plugin
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    console.log("WordPress JWT Response Status:", response.status);
    console.log("WordPress JWT Response Body:", data);

    if (!response.ok || data.token === undefined) {
      // Handle failed login attempts from WP
      // Common error codes might be in data.code or message
      const errorMessage = data.message || "Invalid username or password.";
      console.error(`WP JWT Auth failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    // --- Authentication successful ---

    // 1. Get the current session
    const session = await getIronSession<SessionData>(
      cookies(),
      sessionOptions
    );

    // 2. Update session data
    session.isLoggedIn = true;
    session.username = username; // Or use data.user_email if preferred
    session.displayName = data.user_display_name || username;
    // DO NOT store the token or password in the session directly for security.
    // The isLoggedIn flag is enough for the Next.js app.

    // 3. Save the session (updates the cookie)
    await session.save();
    console.log(`Session saved for ${session.displayName}`);

    return { success: true };
  } catch (error) {
    console.error("Login action fetch/processing error:", error);
    return { success: false, error: "An error occurred during login." };
  }
}
 