import { type NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, UserRole } from "@/generated/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// Temporarily comment out bcrypt
// import { compare } from "bcrypt";

const prisma = new PrismaClient();

// Development user accounts
const DEV_USERS = [
  { email: "supreme@marketsage.africa", name: "Supreme Admin", role: "SUPER_ADMIN" as UserRole },
  { email: "anita@marketsage.africa", name: "Anita Manager", role: "ADMIN" as UserRole },
  { email: "kola@marketsage.africa", name: "Kola Techleads", role: "IT_ADMIN" as UserRole },
  { email: "user@marketsage.africa", name: "Regular User", role: "USER" as UserRole }
];

// Simplified password for all users
const DEV_PASSWORD = "pass1234";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("DEBUG: Authorizing with credentials:", JSON.stringify({ 
          email: credentials?.email,
          passwordLength: credentials?.password?.length
        }));
        
        if (!credentials?.email || !credentials?.password) {
          console.log("DEBUG: Missing credentials");
          return null;
        }

        try {
          // Check for development users first
          const isDevelopmentUser = DEV_USERS.some(u => u.email === credentials.email);
          const isDevPassword = credentials.password === DEV_PASSWORD;
          
          if (isDevelopmentUser && isDevPassword) {
            console.log("DEBUG: Using development account");
            const devUser = DEV_USERS.find(u => u.email === credentials.email);
            
            // If devUser is not found (which shouldn't happen, but to satisfy TypeScript)
            if (!devUser) {
              console.log("DEBUG: Development user not found in array (shouldn't happen)");
              return null;
            }
            
            // Check if user exists in the database
            let dbUser = await prisma.user.findUnique({
              where: { email: credentials.email },
            });
            
            // If not found in DB, create the user
            if (!dbUser) {
              console.log("DEBUG: Creating development user in database");
              dbUser = await prisma.user.create({
                data: {
                  email: devUser.email,
                  name: devUser.name,
                  role: devUser.role,
                  password: DEV_PASSWORD, // Store the dev password
                },
              });
            }
            
            console.log("DEBUG: Development login successful");
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name || devUser.name,
              role: dbUser.role,
              image: dbUser.image,
            };
          }
        
          // Regular user login process
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          console.log("DEBUG: Found user:", user ? `${user.email} (exists)` : "user not found");
          
          if (!user || !user.password) {
            console.log("DEBUG: User not found or has no password");
            return null;
          }

          console.log("DEBUG: Password check:", {
            inputPasswordLength: credentials.password.length,
            storedPasswordLength: user.password.length,
            storedPasswordPreview: user.password.substring(0, 5) + "...",
            passwordsEqual: credentials.password === user.password
          });

          // For development, bypass bcrypt check and compare directly
          const isPasswordValid = credentials.password === user.password;
          
          console.log("DEBUG: Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("DEBUG: Invalid password");
            return null;
          }

          // Update lastLogin timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          console.log("DEBUG: Login successful, returning user");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("DEBUG: Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
