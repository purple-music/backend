export const jwtConstants = {
  secret: process.env.JWT_SECRET!, // TODO make ConfigService that handles missing env variables
};

export const emailConstants = {
  resendApiKey: process.env.RESEND_API_KEY!, // TODO make ConfigService that handles missing env variables
  host: process.env.AUTH_URL!,
  from: process.env.EMAIL_FROM!,
};

export const tokenConstants = {
  emailVerificationExpiry: process.env.EMAIL_VERIFICATION_EXPIRY!,
  passwordResetExpiry: process.env.PASSWORD_RESET_EXPIRY!,
};
