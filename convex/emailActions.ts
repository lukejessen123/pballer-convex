'use node'
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const sendEmailVerification = internalAction({
  args: {
    email: v.string(),
    url: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    console.log('Attempting to send verification email to:', args.email);
    
    // Try using the available environment variables
    const privateKey = process.env.EMAIL_JS_PRIVATE || process.env.CONVEX_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('No private key found in environment variables');
      throw new ConvexError("EmailJS private key is not set. Please set EMAIL_JS_PRIVATE or CONVEX_PRIVATE_KEY environment variable.");
    }

    const input = {
      accessToken: privateKey,
      service_id: "service_8qbemob",
      template_id: "template_qecqn96",
      template_params: {
        message: `Login via email: ${args.url}`,
        subject: 'Login via email',
        to: args.email,
      },
      user_id: "7-7SbUNuRxac7Bz5p",
    };
    
    const body = JSON.stringify(input);
    console.log('Sending request to EmailJS with body:', JSON.stringify(input, null, 2));
    
    try {
      const response = await fetch(
        'https://api.emailjs.com/api/v1.0/email/send',
        {
          body,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const responseText = await response.text();
      console.log('EmailJS response status:', response.status);
      console.log('EmailJS response body:', responseText);
      
      if (!response.ok) {
        throw new ConvexError(`EmailJS API error: ${response.status} - ${responseText}`);
      }
      
      console.log('Email sent successfully to:', args.email);
      return `Email sent successfully to ${args.email}`;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new ConvexError(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 