"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitFeedback, FeedbackFormState } from "@/app/public/search/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

const initialState: FeedbackFormState = {
  message: "",
  errors: {},
  success: false
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? "Submitting..." : "Submit Feedback"}
    </Button>
  );
}

export function FeedbackForm() {
  const [state, formAction] = useFormState(submitFeedback, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset(); // Reset form on successful submission
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-1">
          Feedback Form
        </h3>
        <p className="text-sm text-gray-600">
        Report errors, omissions, or concerns about information you've received. We aim to correct any issues and resend updated information at no extra cost.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor="fileNumber">File Number</Label>
          <Input id="fileNumber" name="fileNumber" type="text" required />
          {state.errors?.fileNumber && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.fileNumber[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="deceasedFullName">Deceased Person's Full Name</Label>
          <Input
            id="deceasedFullName"
            name="deceasedFullName"
            type="text"
            required
          />
          {state.errors?.deceasedFullName && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.deceasedFullName[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor="requestorName">Your Name</Label>
          <Input id="requestorName" name="requestorName" type="text" required />
          {state.errors?.requestorName && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.requestorName[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="requestorEmail">Your Email</Label>
          <Input
            id="requestorEmail"
            name="requestorEmail"
            type="email"
            required
          />
          {state.errors?.requestorEmail && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.requestorEmail[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="issueDescription">Description of the Issue</Label>
        <Textarea
          id="issueDescription"
          name="issueDescription"
          rows={5}
          required
          placeholder="Please provide details of the error, omission or concern."
        />
        {state.errors?.issueDescription && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.issueDescription[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <SubmitButton />
        {state.message && (
          <p
            className={`text-sm ${state.success ? "text-green-600" : "text-red-600"} mt-2 sm:mt-0 text-center sm:text-right`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
