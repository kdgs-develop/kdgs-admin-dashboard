"use server";

import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy(); // Clears the session data and cookie
  console.log("Session destroyed.");
  // Optional: Redirect user after logout
  redirect("/"); // Or wherever you want them to go
}
