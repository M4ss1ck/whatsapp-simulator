import { ChatSettings, ExportedChatData, Message, MessageJson, PhoneStatusBar, Participant } from '../types';

export interface ExportDataInput {
  participants: Participant[];
  messages: Message[];
  chatSettings: ChatSettings;
  meId: string | null;
  phoneStatus: PhoneStatusBar;
  showDateDividers: boolean;
  chatBackground: string;
}

export const serializeMessages = (messages: Message[]): MessageJson[] => {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp.toISOString()
  }));
};

export const deserializeMessages = (messages: MessageJson[]): Message[] => {
  return messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp)
  }));
};

export const buildExportData = (input: ExportDataInput): ExportedChatData => {
  return {
    participants: input.participants,
    messages: serializeMessages(input.messages),
    chatSettings: input.chatSettings,
    meId: input.meId,
    phoneStatus: input.phoneStatus,
    showDateDividers: input.showDateDividers,
    chatBackground: input.chatBackground
  };
};
