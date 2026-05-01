"""
Email notification helper using fastapi-mail.
"""
import logging

logger = logging.getLogger(__name__)
# from app.services.auth_service import OTP_EXPIRE_MINUTES

_mailer = None


def _get_mailer():
    global _mailer
    if _mailer is not None:
        return _mailer
    try:
        from fastapi_mail import FastMail, ConnectionConfig
        from app.config import get_settings
        settings = get_settings()
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.mail_username,
            MAIL_PASSWORD=settings.mail_password,
            MAIL_FROM=settings.mail_from,
            MAIL_FROM_NAME=settings.mail_from_name,
            MAIL_PORT=settings.mail_port,
            MAIL_SERVER=settings.mail_server,
            MAIL_STARTTLS=settings.mail_starttls,
            MAIL_SSL_TLS=settings.mail_ssl_tls,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
        )
        _mailer = FastMail(conf)
        logger.info("Mailer built successfully")
        return _mailer
    except Exception as exc:
        logger.error("Mail configuration error: %s", exc)
        return None


async def send_account_locked_email(email: str, username: str, minutes: int = 30) -> None:
    logger.info(">>> send_account_locked_email called for %s", email)
    try:
        from fastapi_mail import MessageSchema, MessageType
        mailer = _get_mailer()
        if not mailer:
            logger.warning("Mailer is None — skipping lockout email to %s", email)
            return

        message = MessageSchema(
            subject="🔒 Account Temporarily Locked",
            recipients=[email],
            body=f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; padding: 30px;">
                <div style="background: #ff4444; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Account Locked</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{username}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        We detected <strong>3 consecutive failed login attempts</strong>
                        on your <strong>Scan Info Tech</strong> account.
                    </p>
                    <div style="background: #fff3cd; border-left: 5px solid #ff9800; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="font-size: 17px; margin: 0; color: #7a4f00;">
                            Your account has been <strong>temporarily locked for {minutes} minutes 🔒</strong>.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        You can try logging in again after the lockout period expires.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #cc0000;">
                        If this wasn't you, please resset your password immediately.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
                    <p style="font-size: 15px; color: #555; margin: 0;">
                        - The <strong>Scan Info Tech</strong> Team
                    </p>
                </div>
            </body>
            </html>
            """,
            subtype=MessageType.html,
        )
        await mailer.send_message(message)
        logger.info("<<< Lockout email sent successfully to %s", email)
    except Exception as exc:
        logger.error("<<< Failed to send lockout email to %s: %s", email, exc)


async def send_verification_email(email: str, username: str, token: str, base_url: str) -> None:
    logger.info(">>> send_verification_email called for %s", email)
    try:
        from fastapi_mail import MessageSchema, MessageType
        mailer = _get_mailer()
        if not mailer:
            logger.warning("Mailer is None — skipping verification email to %s", email)
            return

        verify_url = f"{base_url}/auth/verify?token={token}"
        message = MessageSchema(
            subject="✅ Verify Your Email",
            recipients=[email],
            body=f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; padding: 30px;">
                <div style="background: #4CAF50; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Verify Your Email</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{username}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Welcome to <strong>Scan Info Tech</strong> 🎉, please verify your
                        email address to activate your account.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        This link expires in <strong>1 hour</strong>.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{verify_url}"
                           style="background: #4CAF50; color: white; padding: 16px 36px;
                                  text-decoration: none; border-radius: 6px; font-size: 18px;
                                  font-weight: bold; display: inline-block;">
                            Verify My Email
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #888; line-height: 1.6;">
                        Or copy and paste this link:<br>
                        <a href="{verify_url}" style="color: #4CAF50; word-break: break-all;">{verify_url}</a>
                    </p>
                    <p style="font-size: 15px; color: #cc0000;">
                        If you did not create an account, ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
                    <p style="font-size: 15px; color: #555; margin: 0;">
                        - The <strong>Scan Info Tech</strong> Team
                    </p>
                </div>
            </body>
            </html>
            """,
            subtype=MessageType.html,
        )
        await mailer.send_message(message)
        logger.info("<<< Verification email sent successfully to %s", email)
    except Exception as exc:
        logger.error("<<< Failed to send verification email to %s: %s", email, exc)


async def send_password_reset_otp(email: str, username: str, otp: str) -> None:
    logger.info(">>> send_password_reset_otp called for %s", email)
    try:
        from fastapi_mail import MessageSchema, MessageType
        mailer = _get_mailer()
        if not mailer:
            logger.warning("Mailer is None — skipping OTP email to %s", email)
            return

        message = MessageSchema(
            subject="🔑 Password Reset OTP",
            recipients=[email],
            body=f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; padding: 30px;">
                <div style="background: #2196F3; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Password Reset</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{username}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        You requested a password reset for your
                        <strong>Scan Info Tech</strong> account.
                    </p>
                    <p style="font-size: 16px;">
                        Use the OTP below to reset your password.
                        It expires in <strong>5 minute(s)</strong>.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <div style="background: #e3f2fd; border: 2px dashed #2196F3;
                                    border-radius: 8px; padding: 24px; display: inline-block;">
                            <p style="margin: 0; font-size: 14px; color: #555; letter-spacing: 1px;">
                                YOUR ONE-TIME PASSWORD
                            </p>
                            <p style="margin: 10px 0 0; font-size: 48px; font-weight: bold;
                                      color: #2196F3; letter-spacing: 12px;">
                                {otp}
                            </p>
                        </div>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Enter this OTP along with your new password in the app.
                    </p>
                    <p style="font-size: 15px; color: #cc0000;">
                        If you did not initiate a password reset, ignore this email.
                        Your password will remain unchanged.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
                    <p style="font-size: 15px; color: #555; margin: 0;">
                        - The <strong>Scan Info Tech</strong> Team
                    </p>
                </div>
            </body>
            </html>
            """,
            subtype=MessageType.html,
        )
        await mailer.send_message(message)
        logger.info("<<< OTP email sent successfully to %s", email)
    except Exception as exc:
        logger.error("<<< Failed to send OTP email to %s: %s", email, exc)


async def send_booking_email(
    service_name: str,
    client_name: str,
    client_email: str,
    client_phone: str,
    message: str,
    admin_email: str,
) -> None:
    logger.info(">>> send_booking_email for service: %s", service_name)
    try:
        from fastapi_mail import MessageSchema, MessageType
        mailer = _get_mailer()
        if not mailer:
            logger.warning("Mailer not configured — skipping booking email")
            return

        message_schema = MessageSchema(
            subject=f"📅 New Service Booking — {service_name}",
            recipients=[admin_email],
            body=f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #1a1a1a;
                         max-width: 600px; margin: auto; padding: 30px;">
                <div style="background: #3b2a1a; padding: 20px;
                            border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">
                        💼 New Service Booking
                    </h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px;
                            border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p style="font-size: 16px; margin-top: 0;">
                        A new booking request has been submitted.
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f0e8dc;">
                            <td style="padding: 12px 16px; font-weight: bold;
                                       font-size: 14px; color: #3b2a1a; width: 35%;">
                                Service
                            </td>
                            <td style="padding: 12px 16px; font-size: 14px;
                                       color: #c17f24; font-weight: bold;">
                                {service_name}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 16px; font-weight: bold;
                                       font-size: 14px; color: #3b2a1a; border-top: 1px solid #eee;">
                                Name
                            </td>
                            <td style="padding: 12px 16px; font-size: 14px;
                                       color: #555; border-top: 1px solid #eee;">
                                {client_name}
                            </td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 12px 16px; font-weight: bold;
                                       font-size: 14px; color: #3b2a1a; border-top: 1px solid #eee;">
                                Email
                            </td>
                            <td style="padding: 12px 16px; font-size: 14px;
                                       color: #555; border-top: 1px solid #eee;">
                                <a href="mailto:{client_email}" style="color: #c17f24;">
                                    {client_email}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 16px; font-weight: bold;
                                       font-size: 14px; color: #3b2a1a; border-top: 1px solid #eee;">
                                Phone
                            </td>
                            <td style="padding: 12px 16px; font-size: 14px;
                                       color: #555; border-top: 1px solid #eee;">
                                {client_phone or "Not provided"}
                            </td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 12px 16px; font-weight: bold;
                                       font-size: 14px; color: #3b2a1a; border-top: 1px solid #eee;">
                                Message
                            </td>
                            <td style="padding: 12px 16px; font-size: 14px;
                                       color: #555; border-top: 1px solid #eee;">
                                {message or "No message provided"}
                            </td>
                        </tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
                    <p style="font-size: 13px; color: #888;">
                        This booking was submitted via the Scan Info Tech website.
                    </p>
                </div>
            </body>
            </html>
            """,
            subtype=MessageType.html,
        )
        await mailer.send_message(message_schema)
        logger.info("<<< Booking email sent successfully")
    except Exception as exc:
        logger.error("<<< Failed to send booking email: %s", exc)
