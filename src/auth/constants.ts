export const jwtConstants = {
  secret: process.env.JWT_SECRET!, // TODO make ConfigService that handles missing env variables
};

export const emailConstants = {
  resendApiKey: process.env.RESEND_API_KEY!, // TODO make ConfigService that handles missing env variables
  emailVerificationPageUrl: process.env.EMAIL_VERIFICATION_PAGE_URL!,
  passwordResetPageUrl: process.env.PASSWORD_RESET_PAGE_URL!,
  from: process.env.EMAIL_FROM!,
};

export const tokenConstants = {
  emailVerificationExpiryHours: 1,
  passwordResetExpiryHours: 1,
};
