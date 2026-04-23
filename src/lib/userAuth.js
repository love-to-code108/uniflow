"use server"; // This is the secret sauce. This code NEVER goes to the browser.

import { db } from "./db"; // Your Prisma singleton

export async function authenticateUser(formData) {
    try {
        // 1. Look for the user in your Docker DB
        const user = await db.user.findUnique({
            where: { username: formData.userName }, // Assuming email is the username
        });

        // 2. Check if user exists
        if (!user) {
            return { success: false, message: "User not found" };
        }

        // 3. Check password (In Demo v1, we check plain text. In v2, we'll hash!)
        if (user.password !== formData.password) {
            return { success: false, message: "Incorrect password" };
        }

        // 4. Success! Return the user data (but hide the password)
        const { password, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };

    } catch (error) {
        console.error("Database error:", error);
        return { success: false, message: "Something went wrong with the database" };
    }
}