
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

// Use credentials provider for email+password authentication
const providers: any[] = [
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email и пароль обязательны");
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error("Неверный email или пароль");
      }

      // Check if user has a password (for backward compatibility with magic link users)
      if (!user.password) {
        throw new Error("Этот аккаунт не поддерживает вход по паролю. Используйте вход через email.");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Неверный email или пароль");
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error("Пожалуйста, подтвердите ваш email перед входом. Проверьте вашу почту.");
      }

      // Return user data
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only check verification for credentials provider
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user?.email || "" },
          select: { emailVerified: true },
        });

        if (!dbUser?.emailVerified) {
          return false; // Block sign in if not verified
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // При первом входе (когда user существует), добавляем данные в токен
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Update token when session is updated
      if (trigger === "update" && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
        // Fetch user role from database
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, bio: true },
        });
        if (user) {
          session.user.role = user.role;
          session.user.bio = user?.bio;
        }
      }
      return session;
    },
  },
  debug: false, // Disabled for production readiness
};
