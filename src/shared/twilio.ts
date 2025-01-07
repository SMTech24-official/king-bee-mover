import { Twilio } from "twilio";
import config from "../config";

export const twilioClient = new Twilio(config.twilio.account_sid, config.twilio.auth_token);