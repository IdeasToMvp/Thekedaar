import { SUPPORT_EMAIL } from "@/lib/supportEmail";

export const LANDING_CONTACT = {
  city: "Gurugram, Haryana",
  email: SUPPORT_EMAIL,
  whatsappHint: "Message us on WhatsApp to get started or request a sign-in link.",
};

export const LANDING_ABOUT = {
  title: "About Thekedaar",
  paragraphs: [
    "Thekedaar helps workers and employers in Gurugram and NCR connect for daily wage, household, shop, and site jobs — with WhatsApp at the centre and a simple web app when you need to apply or post.",
    "Workers can find roles, apply, and share contact only after an employer approves. Employers can post listings, review applications, and reach workers from Find Workers — without juggling dozens of group chats.",
  ],
};

export const LANDING_FAQ: { q: string; a: string }[] = [
  {
    q: "Do I need a password?",
    a: "No. Sign in with your WhatsApp number — we send a one-time link. Your session stays on this device until you sign out.",
  },
  {
    q: "Is Thekedaar free?",
    a: "Workers can browse and apply for free. Employers receive ₹100 Theke Credits when they onboard, then pay from their wallet for job posts and worker contact unlocks. Prices are shown in the app.",
  },
  {
    q: "What are Theke Credits?",
    a: "Theke Credits are prepaid balance for employer hiring features on Thekedaar (e.g. extra job posts or contact unlocks). They are non-refundable, do not expire, and can be used anytime. Theke Credits are used for digital hiring services and are generally non-refundable once added.",
  },
  {
    q: "When is my phone number shared?",
    a: "Workers: after an employer approves your job application or contacts you from Find Workers. Employers: after you approve an applicant or contact a worker.",
  },
  {
    q: "Which cities do you support?",
    a: "We are live in Gurugram first, with more NCR areas coming soon.",
  },
  {
    q: "I did not get the WhatsApp login link",
    a: "Message Hi to our WhatsApp number first, then request the link again within 24 hours. Check the number matches the one you use on WhatsApp.",
  },
];

export const LANDING_PRIVACY_SUMMARY = [
  "We collect your phone number, name, city, and profile details you provide to run the service.",
  "Job and application data is shown to the other party only when you apply, post, approve, or contact — not on a public directory.",
  "Employers may add Theke Credits (prepaid wallet balance) for paid hiring features; credits are non-refundable, do not expire, and are used for digital hiring services.",
  "We use WhatsApp (Meta) to send login links and notifications; their terms also apply.",
  "You can ask us to correct or delete your data by contacting us below.",
];
