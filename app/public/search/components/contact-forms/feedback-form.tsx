"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitFeedback, FeedbackFormState } from "@/app/public/search/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const initialState: FeedbackFormState = {
  message: "",
  errors: {},
  success: false
};

interface FeedbackFormProps {
  onSuccessDialogClose?: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? "Submitting..." : "Submit"}
    </Button>
  );
}

export function FeedbackForm({ onSuccessDialogClose }: FeedbackFormProps) {
  const [state, formAction] = useFormState(submitFeedback, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        formRef.current?.reset();
        setShowSuccessMessage(false);
        if (onSuccessDialogClose) {
          onSuccessDialogClose();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-md">
        <p className="text-lg text-green-700 font-semibold">Success!</p>
        <p className="text-sm text-green-600 text-center mt-2">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <p className="text-sm text-gray-600">
        Report errors, omissions, or concerns about information you've received.
        We aim to correct any issues and resend updated information at no extra
        cost.
      </p>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="fileNumber">File Number (Optional)</Label>
          <Input id="fileNumber" name="fileNumber" type="text" />
          {state.errors?.fileNumber && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.fileNumber[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="deceasedFullName">
            Deceased Person's Full Name (Optional)
          </Label>
          <Input id="deceasedFullName" name="deceasedFullName" type="text" />
          {state.errors?.deceasedFullName && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.deceasedFullName[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="requestorName">Your Name</Label>
          <Input id="requestorName" name="requestorName" type="text" required />
          {state.errors?.requestorName && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.requestorName[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
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

      <div className="flex flex-col items-stretch gap-4 pt-2">
        <SubmitButton />
        {state.message && !state.success && (
          <p
            className={`text-sm ${state.success ? "text-green-600" : "text-red-600"} text-center`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
