"""
One-time Amadeus device authorisation.

Run this ONCE from the project root:
    python -m backend.scripts.amadeus_auth

A real browser window opens. The script auto-fills your username,
Office ID, and password. If Amadeus shows a device-OTP screen,
type the code you received (email/SMS) into the browser and submit.
Once you land inside the portal, press Enter here to save the session.

After this, all future syncs run headless with no OTP prompts.
"""
import asyncio
import sys
import os

# Allow running from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))


async def main():
    from backend.database import SessionLocal
    from backend.models import AmadeusConfig
    from backend.utils.encryption import decrypt
    from backend.amadeus.session import AmadeusSession, PROFILE_DIR

    db = SessionLocal()
    config = db.query(AmadeusConfig).first()
    db.close()

    if not config:
        print("ERROR: No Amadeus config found. Complete the Setup Wizard in TicketTrack first.")
        sys.exit(1)

    username = decrypt(config.wsap_user_encrypted)
    password = decrypt(config.wsap_pass_encrypted)
    totp_secret = decrypt(config.totp_secret_encrypted) if config.totp_secret_encrypted else None

    print(f"\n  Office ID : {config.office_id}")
    print(f"  Username  : {username}")
    print(f"  Profile   : {PROFILE_DIR}\n")
    print("Opening browser...")

    session = AmadeusSession(
        office_id=config.office_id,
        username=username,
        password=password,
        totp_secret=totp_secret,
        headless=False,
    )

    try:
        await session.login()
        input("\n[TicketTrack] Logged in successfully! Press Enter to save session and close browser... ")
        print("Session saved. Future syncs will run automatically without OTP.")
    except Exception as exc:
        print(f"\nERROR: {exc}")
        sys.exit(1)
    finally:
        await session.close()


if __name__ == "__main__":
    asyncio.run(main())
