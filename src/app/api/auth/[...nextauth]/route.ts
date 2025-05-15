import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This is the correct way to implement NextAuth.js in a Route Handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
