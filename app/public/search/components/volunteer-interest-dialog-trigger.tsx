"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { VolunteerInterestForm } from "./contact-forms/volunteer-interest-form";
import { Button } from "@/components/ui/button";

export function VolunteerInterestDialogTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-[#003B5C] hover:text-green-600 underline"
        >
          Volunteer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Volunteer</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow pt-4">
          <VolunteerInterestForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
