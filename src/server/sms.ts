export interface SmsVerificationProvider {
  start(phoneE164: string): Promise<{ challengeId: string }>;
  confirm(challengeId: string, code: string): Promise<boolean>;
}
