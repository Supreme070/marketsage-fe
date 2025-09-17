import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// NextAuth handler - now configured to work with backend API
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
