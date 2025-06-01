"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitVolunteerInterest,
  VolunteerInterestFormState
} from "@/app/public/search/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useRef, useState } from "react";

const initialState: VolunteerInterestFormState = {
  message: "",
  errors: {},
  success: false
};

interface VolunteerInterestFormProps {
  onSuccessDialogClose?: () => void;
}

const areasOfInterestOptions = [
  {
    id: "collecting",
    label: "Collecting obituaries from online or print sources"
  },
  { id: "indexing", label: "Indexing" },
  { id: "scanning", label: "Scanning" },
  { id: "filing", label: "General sorting/preparing/filing obituaries" }
];

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

export function VolunteerInterestForm({
  onSuccessDialogClose
}: VolunteerInterestFormProps) {
  const [state, formAction] = useFormState(
    submitVolunteerInterest,
    initialState
  );
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
      <div>
        <p className="text-sm text-gray-600">
          Help us collect, index and process obituaries to preserve them for
          family historians or other researchers. Let us know your area of
          interest! We have a variety of tasks and provide training, so limited
          computer experience is not a barrier.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" type="text" required />
          {state.errors?.name && (
            <p className="text-sm text-red-500 mt-1">{state.errors.name[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" required />
          {state.errors?.email && (
            <p className="text-sm text-red-500 mt-1">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input id="phone" name="phone" type="tel" />
          {state.errors?.phone && (
            <p className="text-sm text-red-500 mt-1">{state.errors.phone[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>KDGS Member Status</Label>
          <RadioGroup
            name="isMember"
            defaultValue="no"
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="memberYes" />
              <Label htmlFor="memberYes" className="font-normal">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="memberNo" />
              <Label htmlFor="memberNo" className="font-normal">
                No
              </Label>
            </div>
          </RadioGroup>
          {state.errors?.isMember && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.isMember[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Primary Computer Type</Label>
          <RadioGroup
            name="computerType"
            defaultValue="pc"
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pc" id="pc" />
              <Label htmlFor="pc" className="font-normal">
                PC
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mac" id="mac" />
              <Label htmlFor="mac" className="font-normal">
                Mac
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="otherComp" />
              <Label htmlFor="otherComp" className="font-normal">
                Other
              </Label>
            </div>
          </RadioGroup>
          {state.errors?.computerType && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.computerType[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="computerExperience">
            Level of Computer Experience
          </Label>
          <Input
            id="computerExperience"
            name="computerExperience"
            type="text"
            required
            placeholder="e.g., Beginner, Intermediate, Advanced"
          />
          {state.errors?.computerExperience && (
            <p className="text-sm text-red-500 mt-1">
              {state.errors.computerExperience[0]}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Limited experience is acceptable; training is provided.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Areas of Interest (select all that apply)</Label>
        {areasOfInterestOptions.map(item => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`interest-${item.id}`}
              name="areasOfInterest"
              value={item.id}
            />
            <Label
              htmlFor={`interest-${item.id}`}
              className="font-normal text-sm"
            >
              {item.label}
            </Label>
          </div>
        ))}
        {state.errors?.areasOfInterest && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.areasOfInterest[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="otherInterest">
          Other (please specify if your interest isn't listed)
        </Label>
        <Textarea id="otherInterest" name="otherInterest" rows={3} />
        {state.errors?.otherInterest && (
          <p className="text-sm text-red-500 mt-1">
            {state.errors.otherInterest[0]}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Note: Proofreading and database admin roles are typically assigned to
        experienced volunteers. We evaluate your work in indexing to determine
        if and when you are ready to take on the advanced roles should you be
        interested in them, We will have an informal interview after receiving
        your completed form.
      </p>

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
