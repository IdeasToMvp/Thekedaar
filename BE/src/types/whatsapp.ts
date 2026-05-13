export type IncomingTextMessage = {
  from: string; // user phone (wa_id)
  text: string;
  messageId?: string;
};

