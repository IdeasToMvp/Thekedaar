import type { FeedWorker } from "./types";
import type { FeedDetailCell } from "@/components/feed/FeedDetailGrid";

function genderLabel(gender: string | null | undefined): string | null {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Other";
    case "prefer_not_to_say":
      return "Prefer not to say";
    default:
      return null;
  }
}

export function getWorkerDetailCells(worker: FeedWorker): FeedDetailCell[] {
  const items: FeedDetailCell[] = [];

  const location = worker.publicLocation || worker.city;
  if (location) {
    items.push({ key: "location", label: "Area", value: location, fullWidth: true });
  }

  if (worker.age != null) {
    items.push({ key: "age", label: "Age", value: `${worker.age} yrs` });
  }

  const gender = genderLabel(worker.gender);
  if (gender) items.push({ key: "gender", label: "Gender", value: gender });

  if (worker.hasAadhaar === true) {
    items.push({ key: "aadhaar", label: "Aadhaar", value: "Available", tone: "success" });
  } else if (worker.hasAadhaar === false) {
    items.push({ key: "aadhaar", label: "Aadhaar", value: "Not available", tone: "muted" });
  }

  if (worker.experienceYears != null && worker.experienceYears > 0) {
    items.push({
      key: "experience",
      label: "Experience",
      value: `${worker.experienceYears} yr${worker.experienceYears === 1 ? "" : "s"}`,
    });
  }

  if (worker.availability?.trim() && worker.availability !== "Not specified") {
    const avail = worker.availability.trim();
    const urgent = /immediate/i.test(avail);
    items.push({
      key: "availability",
      label: "Start",
      value: avail,
      tone: urgent ? "warning" : "default",
      fullWidth: avail.length > 28,
    });
  }

  return items;
}
