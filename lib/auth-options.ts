import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { PLAN_IDS } from "@/lib/billing-store"

export const authOptions: NextAuthOptions = {
  // ❌ REMOVE adapter (Mongoose does not support it)
  // adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email });

        if (!user) throw new Error("Invalid email or password");
        if (!user.password) throw new Error("Please sign in with Google");

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Invalid email or password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "user",
          plan: user.plan || "free",
          tokensRemaining: user.tokensRemaining || 0,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, create user if doesn't exist
      if (account?.provider === "google" && user.email) {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: "google",
            role: "user",
            plan: PLAN_IDS.TRIAL,
            tokensRemaining: 30,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            onboardingCompleted: false,
            onboardingStep: 0,
          });
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.plan = user.plan;
        // @ts-ignore
        token.tokensRemaining = user.tokensRemaining;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.plan = token.plan;
        // @ts-ignore
        session.user.tokensRemaining = token.tokensRemaining;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
