import { sendWhatsAppText } from "./whatsapp.service";
import {
  BANNED_MESSAGE,
  createNewAccountAfterDelete,
  DELETED_RECOVERY_MESSAGE,
  getUserByPhoneForLifecycle,
  isWithinDeletedRecoveryWindow,
  PAUSED_WELCOME_MESSAGE,
  parseDeletedRecoveryChoice,
  parsePausedChoice,
  reactivateAccount,
  accountStatusOf,
} from "./accountLifecycle.service";
import {
  clearConversationState,
  getConversationState,
  setConversationState,
  type ConversationStep,
} from "./conversation.service";
function isEntryGreeting(text: string, norm: string): boolean {
  const greetings = ["hi", "hii", "hello", "hey", "start"];
  return greetings.includes(norm);
}

async function sendRoleMenuAfterReactivate(phone: string) {
  await setConversationState(phone, "CHOOSE_ROLE", {}, { last_intent: "reactivated", current_flow: "idle" });
  await sendWhatsAppText(
    phone,
    "Account reactivated ✅\n\nHi! Aap abhi kya karna chahte ho?\n\n1) Looking for Job\n2) Hiring / staff chahiye\n\nReply 1 or 2",
  );
}

/**
 * Handles banned / paused / deleted WhatsApp flows. Returns true if the message was consumed.
 */
export async function handleAccountLifecycleWhatsApp(phone: string, text: string, norm: string): Promise<boolean> {
  const user = await getUserByPhoneForLifecycle(phone);
  const state = await getConversationState(phone);

  if (user && accountStatusOf(user) === "banned") {
    await sendWhatsAppText(phone, BANNED_MESSAGE);
    return true;
  }

  if (state.current_step === "ACCOUNT_PAUSED_CHOICE" && user) {
    const choice = parsePausedChoice(text);
    if (!choice) {
      await sendWhatsAppText(phone, "Please reply 1 (Reactivate) or 2 (Keep Paused).");
      return true;
    }
    if (choice === "keep_paused") {
      await sendWhatsAppText(phone, "Okay — your profile stays paused. Send Hi anytime to reactivate.");
      await clearConversationState(phone);
      return true;
    }
    await reactivateAccount(user.id);
    await sendRoleMenuAfterReactivate(phone);
    return true;
  }

  if (state.current_step === "ACCOUNT_DELETED_CHOICE" && user) {
    const choice = parseDeletedRecoveryChoice(text);
    if (!choice) {
      await sendWhatsAppText(phone, "Please reply 1 (Restore Account) or 2 (Create New Account).");
      return true;
    }
    if (choice === "restore") {
      await reactivateAccount(user.id);
      await sendWhatsAppText(phone, "Your account has been restored ✅");
      await sendRoleMenuAfterReactivate(phone);
      return true;
    }
    await createNewAccountAfterDelete(user.id);
    await sendWhatsAppText(
      phone,
      "Starting fresh with a new profile on this number. Your previous listings stay closed.\n\nSend Hi to continue.",
    );
    await clearConversationState(phone);
    await setConversationState(phone, "CHOOSE_ROLE", {}, { last_intent: "new_after_delete", current_flow: "idle" });
    await sendWhatsAppText(
      phone,
      "Hi! Aap abhi kya karna chahte ho?\n\n1) Looking for Job\n2) Hiring / staff chahiye\n\nReply 1 or 2",
    );
    return true;
  }

  if (!user) return false;

  const status = accountStatusOf(user);

  if (status === "deleted") {
    if (isWithinDeletedRecoveryWindow(user.deleted_at)) {
      await setConversationState(phone, "ACCOUNT_DELETED_CHOICE" as ConversationStep, {}, {
        last_intent: "deleted_recovery",
        current_flow: "idle",
      });
      await sendWhatsAppText(phone, DELETED_RECOVERY_MESSAGE);
      return true;
    }
    await createNewAccountAfterDelete(user.id);
    await clearConversationState(phone);
    return false;
  }

  if (status === "paused") {
    await setConversationState(phone, "ACCOUNT_PAUSED_CHOICE" as ConversationStep, { userId: user.id }, {
      last_intent: isEntryGreeting(text, norm) ? "paused_welcome" : "paused_reminder",
      current_flow: "idle",
    });
    await sendWhatsAppText(phone, PAUSED_WELCOME_MESSAGE);
    return true;
  }

  return false;
}
