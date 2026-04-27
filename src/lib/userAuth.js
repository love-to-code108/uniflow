"use server"; 

import { db } from "./db"; 
import { SignJWT } from "jose";
import { cookies } from "next/headers";

// Encode the secret key for jose
const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function authenticateUser(formData) {
    try {
        const user = await db.user.findUnique({
            where: { username: formData.userName }, 
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (user.password !== formData.password) {
            return { success: false, message: "Incorrect password" };
        }

        // --- THE NEW SECURE COOKIE SAUCE ---
        // 1. Create a minimal payload (just the ID, never the password)
        const payload = { userId: user.id };

        // 2. Sign the JWT Token
        const sessionToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d') // Keeps them logged in for 1 week
            .sign(encodedKey);

        // 3. Drop the secure cookie (Notice the await!)
        const cookieStore = await cookies();
        cookieStore.set("session", sessionToken, {
            httpOnly: true, // Prevents JS access (Crucial for security)
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: "lax",
            path: "/",
        });
        // -----------------------------------

        const { password, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };

    } catch (error) {
        console.error("Database error:", error);
        return { success: false, message: "Something went wrong with the database" };
    }
}




export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}