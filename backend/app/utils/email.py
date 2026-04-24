"""
app/utils/email.py
Email notification helper using fastapi-mail.
Lazy initialization so a misconfigured SMTP never crashes the app.
"""
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

_mailer = None


def _get_mailer():
    """Build and cache the FastMail instance on first use."""
    global _mailer
    if _mailer is not None:
        return _mailer
    try:
        from fastapi_mail import FastMail, ConnectionConfig, MessageType
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
        return _mailer
    except Exception as exc:
        logger.error("Mail configuration error: %s", exc)
        return None


async def send_account_locked_email(email: str, username: str, minutes: int = 30) -> None:
    """Send lockout notification email to the user."""
    try:
        from fastapi_mail import MessageSchema, MessageType
        mailer = _get_mailer()
        if not mailer:
            logger.warning("Mailer not configured — skipping lockout email to %s", email)
            return

        message = MessageSchema(
            subject="⚠️ Account Temporarily Locked - Scan Info Tech",
            recipients=[email],
            body=f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Account Locked</h2>
                <p>Hi <strong>{username}</strong>,</p>
                <p>
                    We noticed <strong>3 consecutive failed login attempts</strong>
                    on your Scan Info Tech account.
                </p>
                <p>
                    For your security, your account has been
                    <strong>temporarily locked for {minutes} minutes</strong>.
                </p>
                <p>You can try logging in again after the lockout period expires.</p>
                <p>
                    If this wasn't you, please contact our support team immediately
                    as someone may be trying to access your account.
                </p>
                <br>
                <p>— The Scan Info Tech Team</p>
            </body>
            </html>
            """,
            subtype=MessageType.html,
        )
        await mailer.send_message(message)
        logger.info("Lockout email sent to %s", email)
    except Exception as exc:
        # Never let email failure block the login response
        logger.error("Failed to send lockout email to %s: %s", email, exc)