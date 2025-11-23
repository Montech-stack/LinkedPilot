import 'next-auth';
import { DefaultSession, DefaultJWT } from 'next-auth';
// Import AdapterUser from the V4 next-auth adapters namespace
import { AdapterUser } from 'next-auth/adapters'; 

// Define the custom user properties you are adding
interface CustomUserFields {
  role: string;
  plan: string;
  tokensRemaining: number;
  billingEnabled: boolean;
}

// 1. Augment the NextAuth Session object
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & CustomUserFields & {
      id: string; // Ensure id is also added to the session user
    };
  }
}

// 2. Augment the NextAuth JWT object
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT, CustomUserFields {
    id: string; // Ensure id is on the JWT
  }
}

// 3. Augment the AdapterUser type used by the database adapter (CRITICAL FIX)
// This is necessary to satisfy the requirements of the MongooseAdapter
declare module 'next-auth/adapters' {
  interface AdapterUser extends CustomUserFields {
    // AdapterUser requires these core fields (inherited, but listed for clarity)
    email: string;
    emailVerified: Date | null;
  }
}