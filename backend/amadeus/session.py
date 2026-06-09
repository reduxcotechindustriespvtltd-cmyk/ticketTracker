"""
Amadeus session facade — wraps WSAPClient with the same interface
that the rest of the codebase (sync tasks, etc.) already uses.
"""
import logging
from typing import Optional

from .wsap_client import WSAPClient

logger = logging.getLogger(__name__)


class AmadeusSession:
    """
    Drop-in replacement for the old Playwright-based session.
    Uses the official Amadeus WSAP SOAP API — no browser, no OTP.
    """

    def __init__(
        self,
        office_id: str,
        username: str,
        password: str,
        totp_secret: Optional[str] = None,   # kept for API compat, not used by WSAP
        wsap_endpoint: Optional[str] = None,
    ):
        if not wsap_endpoint:
            raise ValueError(
                "wsap_endpoint is required. "
                "Set it in TicketTrack Settings → GDS Configuration."
            )
        self._client = WSAPClient(
            endpoint=wsap_endpoint,
            username=username,
            password=password,
            office_id=office_id,
        )
        self._logged_in = False

    async def __aenter__(self):
        await self._client.authenticate()
        self._logged_in = True
        return self

    async def __aexit__(self, *_):
        await self.close()

    async def execute_command(self, command: str) -> str:
        if not self._logged_in:
            raise RuntimeError("AmadeusSession not authenticated")
        return await self._client.execute_command(command)

    async def close(self) -> None:
        await self._client.sign_out()
        self._logged_in = False


class MockAmadeusSession:
    """Stub for unit tests — returns canned responses without hitting WSAP."""

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass

    async def execute_command(self, command: str) -> str:
        return f"MOCK RESPONSE FOR: {command}\nNO DATA AVAILABLE"

    async def close(self):
        pass
