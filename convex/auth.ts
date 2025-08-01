import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    {
      id: "custom",
      name: "custom",
      type: "email",
      async sendVerificationRequest(params) {
        // For now, just log the verification request
        // TODO: Implement proper email sending logic
        console.log('Verification request for:', params.identifier, 'with URL:', params.url);
      },
    }
  ],
});
