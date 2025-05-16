"use server";

import { z } from "zod";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Get email addresses from environment variables
// These should be configured in your .env file:
// OBITUARY_IMAGE_REQUESTS_EMAIL - The email address that receives obituary image requests
// OBITUARY_FROM_EMAIL - The sender email address used by Resend
// OBITUARY_FROM_NAME - The sender name displayed in email clients
const OBITUARY_IMAGE_REQUESTS_EMAIL_TO =
  process.env.OBITUARY_IMAGE_REQUESTS_EMAIL || "images.obits@kdgs.ca";
const OBITUARY_FROM_EMAIL =
  process.env.OBITUARY_FROM_EMAIL || "no-reply@obits.kdgs.ca";
const OBITUARY_FROM_NAME =
  process.env.OBITUARY_FROM_NAME || "KDGS Obituary Requests";

// Define validation schema for form data
const requestFormSchema = z.object({
  requesterEmail: z.string().email("Please enter a valid email address"),
  requesterFullName: z.string().min(1, "Please enter your full name"),
  requesterCountry: z.string().min(1, "Please select your country"),
  requesterProvince: z.string().optional(),
  requesterCity: z.string().optional(),
  requesterPhoneNumber: z.string().optional(),

  // Person details - now optional as this is an image request for a known ref
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  alsoKnownAs: z.string().optional(),

  // Relatives (optional arrays) - kept optional
  relatives: z
    .array(
      z.object({
        name: z.string().optional(),
        relationship: z.string().optional()
      })
    )
    .optional(),

  // Birth info - now optional
  birthExactDate: z.string().optional(),
  birthYearRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional()
    })
    .optional(),
  birthPlace: z.string().optional(),

  // Death info - now optional
  deathExactDate: z.string().optional(),
  deathYearRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional()
    })
    .optional(),
  deathPlace: z.string().optional(),

  // Additional info
  notes: z.string().optional(),

  // Reference from the system
  obituaryRef: z.string(), // This remains required
  obituaryName: z.string().optional() // New field for deceased's name
});

export type ObituaryRequestFormData = z.infer<typeof requestFormSchema>;

export async function sendObituaryRequestEmail(
  formData: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate form data
    const validatedData = requestFormSchema.parse(formData);

    // Construct email content - Simplified for Image Request
    // We assume obituaryName is not directly part of formData but available via obituaryRef if needed by internal lookup
    const emailContent = `
    <h2>Obituary Image Request (File Number: ${validatedData.obituaryRef})</h2>
    
    <h3>Requester's Contact Information:</h3>
    <p>Full Name: ${validatedData.requesterFullName}</p>
    <p>Email: ${validatedData.requesterEmail}</p>
    <p>Phone Number: ${validatedData.requesterPhoneNumber || "Not provided"}</p>
    <p>Country: ${validatedData.requesterCountry}</p>
    <p>Province/State: ${validatedData.requesterProvince || "Not provided"}</p>
    <p>City: ${validatedData.requesterCity || "Not provided"}</p>
    
    <h3>Deceased Information (from original record):</h3>
    <p>File Number: ${validatedData.obituaryRef}</p>
    ${validatedData.obituaryName ? `<p>Name: ${validatedData.obituaryName}</p>` : ""}
    <p><em>(Note: Deceased details are based on the File Number provided. This request is for the associated image.)</em></p>

    ${validatedData.notes ? `<h3>Additional Notes from Requester:</h3><p>${validatedData.notes}</p>` : "<p>No additional notes provided.</p>"}
    `;

    // The detailed sections for person to search, relatives, birth/death info are less relevant for an image request
    // If these details are still sent (as optional placeholders from client), they are available in validatedData
    // but the email is now focused on the image request for the given obituaryRef.

    // Send email using Resend
    const result = await resend.emails.send({
      from: `${OBITUARY_FROM_NAME} <${OBITUARY_FROM_EMAIL}>`,
      to: [validatedData.requesterEmail], // User receives the email directly
      bcc: [OBITUARY_IMAGE_REQUESTS_EMAIL_TO], // Obituary images admin email is BCC'd
      subject: `Obituary Image Request (File No: ${validatedData.obituaryRef})`,
      html: emailContent,
      replyTo: validatedData.requesterEmail
    });

    if (result.error) {
      console.error("Error sending email:", result.error);
      return {
        success: false,
        error: "Failed to send email request. Please try again later."
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error processing obituary request:", error);

    if (error instanceof z.ZodError) {
      // Format validation errors
      const errorMessages = error.errors.map(e => e.message).join(", ");
      return {
        success: false,
        error: `Please check your form inputs: ${errorMessages}`
      };
    }

    return {
      success: false,
      error:
        "An unexpected error occurred processing your request. Please try again later."
    };
  }
}
