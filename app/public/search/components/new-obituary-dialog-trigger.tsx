"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { NewObituaryForm } from "./contact-forms/new-obituary-form";
import { Button } from "@/components/ui/button";

export function NewObituaryDialogTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-[#003B5C] hover:text-green-600 underline"
        >
          Submit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh] p-6">
        <DialogHeader>
          <DialogTitle>Submit</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow px-2 pt-2">
          <NewObituaryForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
