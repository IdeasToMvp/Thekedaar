import { AccountGate } from "@/components/feed/AccountGate";
import { ContactedWorkersPageContent } from "@/components/feed/ContactedWorkersPageContent";

export default function ContactedWorkersPage() {
  return (
    <AccountGate allow="employer">
      <ContactedWorkersPageContent />
    </AccountGate>
  );
}
