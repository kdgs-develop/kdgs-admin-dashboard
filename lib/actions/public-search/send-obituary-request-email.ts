"use server";

import { z } from "zod";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Get email addresses from environment variables
// These should be configured in your .env file:
// OBITUARY_REQUESTS_EMAIL - The email address that receives obituary requests
// OBITUARY_FROM_EMAIL - The sender email address used by Resend
// OBITUARY_FROM_NAME - The sender name displayed in email clients
const OBITUARY_REQUESTS_EMAIL =
  process.env.OBITUARY_REQUESTS_EMAIL || "obits@kdgs.ca";
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

  // Person details
  surname: z.string().min(1, "Surname is required"),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  alsoKnownAs: z.string().optional(),

  // Relatives (optional arrays)
  relatives: z
    .array(
      z.object({
        name: z.string().optional(),
        relationship: z.string().optional()
      })
    )
    .optional(),

  // Birth info
  birthExactDate: z.string().optional(),
  birthYearRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional()
    })
    .optional(),
  birthPlace: z.string().optional(),

  // Death info
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
  obituaryRef: z.string()
});

export type ObituaryRequestFormData = z.infer<typeof requestFormSchema>;

export async function sendObituaryRequestEmail(
  formData: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate form data
    const validatedData = requestFormSchema.parse(formData);

    // Format relatives for email
    const relativesText =
      validatedData.relatives
        ?.filter(r => r.name || r.relationship)
        .map(
          (rel, idx) =>
            `Relative ${idx + 1}: ${rel.name || "N/A"} (${rel.relationship || "N/A"})`
        )
        .join("\n") || "None provided";

    // Format birth date/range
    let birthDateInfo = "Not provided";
    if (validatedData.birthExactDate) {
      birthDateInfo = validatedData.birthExactDate;
    } else if (
      validatedData.birthYearRange?.from ||
      validatedData.birthYearRange?.to
    ) {
      birthDateInfo = `Between ${validatedData.birthYearRange?.from || "?"} and ${validatedData.birthYearRange?.to || "?"}`;
    }

    // Format death date/range
    let deathDateInfo = "Not provided";
    if (validatedData.deathExactDate) {
      deathDateInfo = validatedData.deathExactDate;
    } else if (
      validatedData.deathYearRange?.from ||
      validatedData.deathYearRange?.to
    ) {
      deathDateInfo = `Between ${validatedData.deathYearRange?.from || "?"} and ${validatedData.deathYearRange?.to || "?"}`;
    }

    // Construct email content
    const emailContent = `
    <h2>Obituary Record Request (Reference: ${validatedData.obituaryRef})</h2>
    
    <h3>Requester Information:</h3>
    <p>Name: ${validatedData.requesterFullName}</p>
    <p>Email: ${validatedData.requesterEmail}</p>
    <p>Country: ${validatedData.requesterCountry}</p>
    <p>Province/State: ${validatedData.requesterProvince || "Not provided"}</p>
    
    <h3>Person to Search:</h3>
    <p>Surname: ${validatedData.surname}</p>
    <p>Given Names: ${validatedData.givenNames || "Not provided"}</p>
    <p>Maiden Name: ${validatedData.maidenName || "Not provided"}</p>
    <p>Also Known As: ${validatedData.alsoKnownAs || "Not provided"}</p>
    
    <h3>Relatives:</h3>
    <pre>${relativesText}</pre>
    
    <h3>Birth Information:</h3>
    <p>Date: ${birthDateInfo}</p>
    <p>Place: ${validatedData.birthPlace || "Not provided"}</p>
    
    <h3>Death Information:</h3>
    <p>Date: ${deathDateInfo}</p>
    <p>Place: ${validatedData.deathPlace || "Not provided"}</p>
    
    <h3>Additional Notes:</h3>
    <p>${validatedData.notes || "None provided"}</p>
    `;

    // Send email using Resend
    const result = await resend.emails.send({
      from: `${OBITUARY_FROM_NAME} <${OBITUARY_FROM_EMAIL}>`,
      to: [OBITUARY_REQUESTS_EMAIL],
      cc: [validatedData.requesterEmail], // Send a copy to the requester
      subject: `Obituary Record Request (Ref: ${validatedData.obituaryRef})`,
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
