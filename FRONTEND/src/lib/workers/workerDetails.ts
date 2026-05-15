import type { FeedWorker } from "./types";

export type WorkerDetailItem = {
  key: string;
  label: string;
  value: string;
};

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

export function getWorkerDetailItems(worker: FeedWorker): WorkerDetailItem[] {
  const items: WorkerDetailItem[] = [];

  const location = worker.publicLocation || worker.city;
  if (location) {
    items.push({ key: "location", label: "Area", value: location });
  }

  if (worker.age != null) {
    items.push({ key: "age", label: "Age", value: String(worker.age) });
  }

  const gender = genderLabel(worker.gender);
  if (gender) items.push({ key: "gender", label: "Gender", value: gender });

  if (worker.hasAadhaar === true) items.push({ key: "aadhaar", label: "Aadhaar", value: "Available" });
  else if (worker.hasAadhaar === false) items.push({ key: "aadhaar", label: "Aadhaar", value: "Not available" });

  if (worker.experienceYears != null && worker.experienceYears > 0) {
    items.push({
      key: "experience",
      label: "Experience",
      value: `${worker.experienceYears} yr${worker.experienceYears === 1 ? "" : "s"}`,
    });
  }

  if (worker.expectedSalary > 0) {
    items.push({
      key: "salary",
      label: "Expected",
      value: `₹${worker.expectedSalary.toLocaleString("en-IN")}/mo`,
    });
  }

  if (worker.availability?.trim() && worker.availability !== "Not specified") {
    items.push({ key: "availability", label: "Available", value: worker.availability.trim() });
  }

  return items;
}
