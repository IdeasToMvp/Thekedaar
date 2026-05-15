import { AccountGate } from "@/components/feed/AccountGate";
import { MyListingsPageContent } from "@/components/feed/MyListingsPageContent";

export default function MyListingsPage() {
  return (
    <AccountGate allow="employer">
      <MyListingsPageContent />
    </AccountGate>
  );
}
