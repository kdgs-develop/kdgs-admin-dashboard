"use client";

import { FileBoxAdministration } from "./filebox-administration";
import { useEffect, useState } from "react";

export function FileBoxAdministrationModal() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Force the component to be expanded when used in modal
  useEffect(() => {
    setIsExpanded(true);
  }, []);

  return <FileBoxAdministration forceExpanded={isExpanded} />;
}
