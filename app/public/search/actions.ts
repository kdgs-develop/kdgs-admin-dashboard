"use server";

import { z } from "zod";
import { Resend } from "resend";

// Initialize Resend client
// Make sure RESEND_API_KEY is set in your environment variables
const resend = new Resend(process.env.RESEND_API_KEY);
// IMPORTANT: Replace "noreply@yourverifieddomain.com" with an email address
// from a domain you have verified with Resend.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "KDGS Forms <no-reply@obits.kdgs.ca>";

// Target Email Addresses with fallback to defaults
const FEEDBACK_TARGET_EMAIL =
  process.env.FEEDBACK_EMAIL_TARGET || "obits@kdgs.ca";
const NEW_OBITUARY_TARGET_EMAIL =
  process.env.NEW_OBITUARY_EMAIL_TARGET || "new.obits@kdgs.ca";
const VOLUNTEER_TARGET_EMAIL =
  process.env.VOLUNTEER_EMAIL_TARGET || "obits@kdgs.ca";

// Define a generic response type for actions
interface ActionResult {
  success: boolean;
  message: string;
  error?: string | null;
}

// Schema for Feedback Form
const FeedbackFormSchema = z.object({
  fileNumber: z.string().optional(),
  deceasedFullName: z.string().optional(),
  requestorName: z.string().min(1, "Your Name is required."),
  requestorEmail: z.string().email("Invalid email address."),
  issueDescription: z.string().min(1, "Description of the Issue is required.")
});

export type FeedbackFormState = {
  message: string;
  errors?: {
    fileNumber?: string[];
    deceasedFullName?: string[];
    requestorName?: string[];
    requestorEmail?: string[];
    issueDescription?: string[];
  };
  success: boolean;
};

export async function submitFeedback(
  prevState: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const validatedFields = FeedbackFormSchema.safeParse({
    fileNumber: formData.get("fileNumber"),
    deceasedFullName: formData.get("deceasedFullName"),
    requestorName: formData.get("requestorName"),
    requestorEmail: formData.get("requestorEmail"),
    issueDescription: formData.get("issueDescription")
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false
    };
  }

  const {
    fileNumber,
    deceasedFullName,
    requestorName,
    requestorEmail,
    issueDescription
  } = validatedFields.data;

  // TODO: Implement email sending logic using Resend
  // console.log("Feedback Form Data:", {
  //   fileNumber,
  //   deceasedFullName,
  //   requestorName,
  //   requestorEmail,
  //   issueDescription
  // });
  // console.log("Email to: obits@kdgs.ca");

  // Simulate email sending
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: FEEDBACK_TARGET_EMAIL, // Use configurable target email
      replyTo: requestorEmail,
      subject: `New Feedback Received${fileNumber ? ` - File: ${fileNumber}` : ""}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>File Number:</strong> ${fileNumber || "N/A"}</p>
        <p><strong>Deceased Person's Full Name:</strong> ${deceasedFullName || "N/A"}</p>
        <p><strong>Requestor's Name:</strong> ${requestorName}</p>
        <p><strong>Requestor's Email:</strong> ${requestorEmail}</p>
        <p><strong>Description of the Issue:</strong></p>
        <p>${issueDescription.replace(/\\n/g, "<br>")}</p>
        <hr>
        <p><small>This email was sent from the KDGS Admin Dashboard search page feedback form.</small></p>
      `
    });

    return {
      message:
        "Feedback submitted successfully! We will review your submission and get back to you if necessary. If a correction is needed, we'll send a revised version at no extra cost.",
      success: true
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return {
      message: "Failed to submit feedback. Please try again later.",
      success: false
      // error: error instanceof Error ? error.message : "Unknown error" // More specific error handling if needed
    };
  }
}

// Schema for New Obituary Submission Form
const NewObituarySubmissionFormSchema = z.object({
  requestorName: z.string().min(1, "Your Name is required."),
  requestorEmail: z
    .string()
    .email("A valid email address is required for correspondence."),
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  alsoKnownAs: z.string().optional(),
  birthDate: z.string().optional(), // Combined field for date and place
  deathDate: z.string().optional(), // Combined field for date and place
  knownRelatives: z.string().optional(),
  notes: z.string().optional(),
  obituaryFile: (typeof File !== "undefined" ? z.instanceof(File) : z.any())
    .optional() // For file uploads
    .refine(
      file => !file || file.size <= 5 * 1024 * 1024,
      `Max file size is 5MB.`
    )
    .refine(
      file =>
        !file ||
        ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
          file.type
        ),
      "Only .pdf, .jpg, .jpeg, .png and .webp formats are supported."
    ),
  citation: z.string().optional(),
  imageUrl: z
    .string()
    .url("Please enter a valid URL for the image.")
    .optional()
    .or(z.literal(""))
});

export type NewObituaryFormState = {
  message: string;
  errors?: {
    requestorName?: string[];
    requestorEmail?: string[];
    surname?: string[];
    givenNames?: string[];
    maidenName?: string[];
    alsoKnownAs?: string[];
    birthDate?: string[];
    deathDate?: string[];
    knownRelatives?: string[];
    notes?: string[];
    obituaryFile?: string[];
    citation?: string[];
    imageUrl?: string[];
  };
  success: boolean;
};

export async function submitNewObituary(
  prevState: NewObituaryFormState,
  formData: FormData
): Promise<NewObituaryFormState> {
  const validatedFields = NewObituarySubmissionFormSchema.safeParse({
    requestorName: formData.get("requestorName"),
    requestorEmail: formData.get("requestorEmail"),
    surname: formData.get("surname"),
    givenNames: formData.get("givenNames"),
    maidenName: formData.get("maidenName"),
    alsoKnownAs: formData.get("alsoKnownAs"),
    birthDate: formData.get("birthDate"),
    deathDate: formData.get("deathDate"),
    knownRelatives: formData.get("knownRelatives"),
    notes: formData.get("notes"),
    obituaryFile: formData.get("obituaryFile"),
    citation: formData.get("citation"),
    imageUrl: formData.get("imageUrl")
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false
    };
  }

  const data = validatedFields.data;

  // TODO: Implement email sending logic using Resend, including file attachment if provided
  // console.log("New Obituary Form Data:", data);
  // console.log("Email to: new.obits@kdgs.ca");

  const attachments = [];
  if (data.obituaryFile && data.obituaryFile.size > 0) {
    try {
      const fileBuffer = Buffer.from(await data.obituaryFile.arrayBuffer());
      attachments.push({
        filename: data.obituaryFile.name,
        content: fileBuffer
      });
    } catch (e) {
      console.error("Error processing file for attachment:", e);
      // Optionally, return an error state if file processing fails critically
      // For now, we'll proceed without the attachment if it fails
    }
  }

  // Simulate email sending
  try {
    let emailHtmlBody = `
      <h2>New Obituary Submission</h2>
      <h3>Submitter Information:</h3>
      <p><strong>Name:</strong> ${data.requestorName}</p>
      <p><strong>Email:</strong> ${data.requestorEmail}</p>
      <hr>
      <h3>Deceased Person's Information:</h3>
      <p><strong>Surname:</strong> ${data.surname || "N/A"}</p>
      <p><strong>Given Names:</strong> ${data.givenNames || "N/A"}</p>
      <p><strong>Maiden Name:</strong> ${data.maidenName || "N/A"}</p>
      <p><strong>Also Known As:</strong> ${data.alsoKnownAs || "N/A"}</p>
      <p><strong>Date or Range & Place of Birth:</strong> ${data.birthDate || "N/A"}</p>
      <p><strong>Date or Range & Place of Death:</strong> ${data.deathDate || "N/A"}</p>
      <p><strong>Known Relatives:</strong></p>
      <p>${data.knownRelatives ? data.knownRelatives.replace(/\\n/g, "<br>") : "N/A"}</p>
      <p><strong>Notes:</strong></p>
      <p>${data.notes ? data.notes.replace(/\\n/g, "<br>") : "N/A"}</p>
    `;

    if (data.imageUrl) {
      emailHtmlBody += `<p><strong>Image URL:</strong> <a href="${data.imageUrl}">${data.imageUrl}</a></p>`;
    }

    if (attachments.length > 0) {
      emailHtmlBody += `<p><strong>Citation:</strong> ${data.citation || "N/A (File Attached)"}</p>`;
      emailHtmlBody += `<p>An obituary file has been attached to this email: ${attachments[0].filename}</p>`;
    } else {
      emailHtmlBody += `<p><strong>Citation:</strong> ${data.citation || "N/A (No File Attached)"}</p>`;
    }
    emailHtmlBody += `
      <hr>
      <p><small>This email was sent from the KDGS Admin Dashboard search page new obituary submission form.</small></p>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: NEW_OBITUARY_TARGET_EMAIL, // Use configurable target email
      replyTo: data.requestorEmail, // Set replyTo to submitter's email
      subject: `New Obituary Submission: ${data.surname || "Unknown Surname"}`,
      html: emailHtmlBody,
      attachments: attachments
    });

    let successMessage = "Obituary submission received. ";
    if (data.obituaryFile && data.citation) {
      successMessage +=
        "Thank you for providing the obituary file and citation. We will add it to our database and send you a free copy once processed.";
    } else if (!data.obituaryFile) {
      successMessage +=
        "If an obituary is not provided, please note that an additional research fee plus a download fee may apply. We will contact you with further details.";
    }

    return {
      message: successMessage,
      success: true
    };
  } catch (error) {
    console.error("Error submitting new obituary:", error);
    return {
      message: "Failed to submit new obituary. Please try again later.",
      success: false
    };
  }
}

// Schema for Volunteer Interest Form
const VolunteerInterestFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  isMember: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Please select member status." })
  }),
  computerType: z.enum(["pc", "mac", "other"], {
    errorMap: () => ({ message: "Please select computer type." })
  }),
  computerExperience: z
    .string()
    .min(1, "Level of computer experience is required."),
  areasOfInterest: z
    .array(z.string())
    .nonempty({ message: "Please select at least one area of interest." }),
  otherInterest: z.string().optional()
});

export type VolunteerInterestFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    isMember?: string[];
    computerType?: string[];
    computerExperience?: string[];
    areasOfInterest?: string[];
    otherInterest?: string[];
  };
  success: boolean;
};

export async function submitVolunteerInterest(
  prevState: VolunteerInterestFormState,
  formData: FormData
): Promise<VolunteerInterestFormState> {
  const interests = formData.getAll("areasOfInterest");

  const validatedFields = VolunteerInterestFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    isMember: formData.get("isMember"),
    computerType: formData.get("computerType"),
    computerExperience: formData.get("computerExperience"),
    areasOfInterest: interests,
    otherInterest: formData.get("otherInterest")
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false
    };
  }

  const data = validatedFields.data;

  // TODO: Implement email sending logic using Resend
  // console.log("Volunteer Interest Form Data:", data);
  // console.log("Email to: obits@kdgs.ca");

  // Simulate email sending
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: VOLUNTEER_TARGET_EMAIL, // Use configurable target email
      replyTo: data.email,
      subject: `New Volunteer Interest: ${data.name}`,
      html: `
        <h2>New Volunteer Interest Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
        <p><strong>KDGS Member:</strong> ${data.isMember}</p>
        <p><strong>Computer Type:</strong> ${data.computerType}</p>
        <p><strong>Level of Computer Experience:</strong> ${data.computerExperience}</p>
        <p><strong>Areas of Interest:</strong></p>
        <ul>
          ${data.areasOfInterest.map(interest => `<li>${interest}</li>`).join("")}
        </ul>
        <p><strong>Other Interest:</strong></p>
        <p>${data.otherInterest ? data.otherInterest.replace(/\\n/g, "<br>") : "N/A"}</p>
        <hr>
        <p><small>This email was sent from the KDGS Admin Dashboard search page volunteer interest form.</small></p>
      `
    });

    return {
      message:
        "Thank you for your interest in volunteering! We have received your information and will follow up with an interview before any role assignment.",
      success: true
    };
  } catch (error) {
    console.error("Error submitting volunteer interest:", error);
    return {
      message: "Failed to submit volunteer interest. Please try again later.",
      success: false
    };
  }
}
