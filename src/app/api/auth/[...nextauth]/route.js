import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Define the NextAuth configuration options here
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
};

// Create the NextAuth handlers
const handlers = NextAuth(authOptions);

// Export the GET and POST handlers for the Next.js App Router
export { handlers as GET, handlers as POST };
