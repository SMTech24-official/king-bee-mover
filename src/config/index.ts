import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    env: process.env.NODE_ENV,
    stripe_key:process.env.STRIPE_SECRET_KEY,
    port: process.env.PORT,
    bcrypt_salt_rounds:process.env.BCRYPT_SALT_ROUNDS,
    frontend_base_url: process.env.FRONTEND_BASE_URL,
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        expires_in: process.env.EXPIRES_IN,
        refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
        refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
        reset_pass_secret: process.env.RESET_PASS_TOKEN,
        reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN
    },
    reset_pass_link: process.env.RESET_PASS_LINK,
    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS
    },
    twilio: {
        account_sid: process.env.TWILIO_ACCOUNT_SID,
        auth_token: process.env.TWILIO_AUTH_TOKEN,
        phone_number: process.env.TWILIO_PHONE_NUMBER,
        verify_service_sid: process.env.TWILIO_VERIFY_SERVICE_SID
    }
}
 