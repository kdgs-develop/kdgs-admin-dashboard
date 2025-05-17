"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitNewObituary,
  NewObituaryFormState
} from "@/app/public/search/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const initialState: NewObituaryFormState = {
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
      {pending ? "Submitting..." : "Submit Obituary Information"}
    </Button>
  );
}

export function NewObituaryForm() {
  const [state, formAction] = useFormState(submitNewObituary, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setFileName(null);
    }
  }, [state.success]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-1">
          New Obituary Submission
        </h3>
        <p className="text-sm text-gray-600">
          Request indexing of an unlisted obituary or submit one for a person
          who lived/died in Central Okanagan. Please provide your contact
          details first.
        </p>
      </div>

      {/* Submitter Information Section */}
      <div className="space-y-4 border-b border-gray-200 pb-6">
        <h4 className="text-lg font-medium text-gray-700">Your Information</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <Label htmlFor="requestorName">Your Name</Label>
            <Input
              id="requestorName"
              name="requestorName"
              type="text"
              required
            />
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
              placeholder="For correspondence and free copy if applicable"
            />
            {state.errors?.requestorEmail && (
              <p className="text-sm text-red-500 mt-1">
                {state.errors.requestorEmail[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Deceased Person's Information Section */}
      <div className="space-y-4 pt-4">
        <h4 className="text-lg font-medium text-gray-700">
          Deceased Person's Information
        </h4>
        <p className="text-sm text-gray-500">
          Fill in as much information as you know about the deceased.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor="surname">Surname</Label>
          <Input id="surname" name="surname" type="text" />
          {state.errors?.surname && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.surname[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="givenNames">Given Names</Label>
          <Input id="givenNames" name="givenNames" type="text" />
          {state.errors?.givenNames && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.givenNames[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor="maidenName">Maiden Name (if applicable)</Label>
          <Input id="maidenName" name="maidenName" type="text" />
          {state.errors?.maidenName && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.maidenName[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="alsoKnownAs">
            Also Known As (nicknames, other surnames)
          </Label>
          <Input id="alsoKnownAs" name="alsoKnownAs" type="text" />
          {state.errors?.alsoKnownAs && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.alsoKnownAs[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor="birthDate">Date or Range & Place of Birth</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="text"
            placeholder="e.g., 1920-1922, Kelowna, BC"
          />
          {state.errors?.birthDate && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.birthDate[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="deathDate">Date or Range & Place of Death</Label>
          <Input
            id="deathDate"
            name="deathDate"
            type="text"
            placeholder="e.g., Dec 5, 2023, Vernon, BC"
          />
          {state.errors?.deathDate && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.deathDate[0]}
            </p>
          )}
        </div>
      </div>
      {/* Removed birthPlace and deathPlace as combined with date fields based on schema description "Date or Range and Place of Birth/Death" */}

      <div>
        <Label htmlFor="knownRelatives">
          Known Relatives (names, relationships)
        </Label>
        <Textarea
          id="knownRelatives"
          name="knownRelatives"
          rows={3}
          placeholder="e.g., Spouse: Jane Doe; Children: John Doe, Mary Smith"
        />
        {state.errors?.knownRelatives && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.knownRelatives[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes (any additional details)</Label>
        <Textarea id="notes" name="notes" rows={3} />
        {state.errors?.notes && (
          <p className="text-sm text-red-500 mt-1">{state.errors.notes[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="obituaryFile">Upload Obituary File (Optional)</Label>
        <Input
          id="obituaryFile"
          name="obituaryFile"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
        />
        {fileName && (
          <p className="text-sm text-gray-500 mt-1">
            Selected file: {fileName}
          </p>
        )}
        {state.errors?.obituaryFile && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.obituaryFile[0]}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Max file size: 5MB. Accepted formats: PDF, JPG, PNG, WEBP.
        </p>
      </div>

      <div>
        <Label htmlFor="citation">
          Citation (if uploading file: publication name and date)
        </Label>
        <Input
          id="citation"
          name="citation"
          type="text"
          placeholder="e.g., Kelowna Daily Courier, Jan 15, 2024"
        />
        {state.errors?.citation && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.citation[0]}
          </p>
        )}
      </div>

      <div className="pt-2">
        <p className="text-sm text-gray-600 mb-2">
          If an obituary image and citation are provided, it will be added to
          the database at no cost, and one free copy will be sent to you. If no
          obituary is provided, an additional research fee plus a download fee
          may apply.
        </p>
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
