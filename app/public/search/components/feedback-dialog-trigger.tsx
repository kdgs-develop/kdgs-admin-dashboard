"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { FeedbackForm } from "./contact-forms/feedback-form";
import { Button } from "@/components/ui/button";

export function FeedbackDialogTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-[#003B5C] hover:text-green-600 underline"
        >
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow pt-4">
          <FeedbackForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
