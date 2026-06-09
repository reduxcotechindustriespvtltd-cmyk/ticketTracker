"""
Amadeus WSAP (Web Services Access Point) SOAP client.

Replaces the Playwright browser approach with official API calls.
Each customer provides their WSAP credentials (issued by Amadeus with their GDS contract).
No browser, no OTP, scales to any number of tenants.
"""
import base64
import hashlib
import html
import logging
import os
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_NS_SOAP   = "http://schemas.xmlsoap.org/soap/envelope/"
_NS_ADDR   = "http://www.w3.org/2005/08/addressing"
_NS_SESS   = "http://xml.amadeus.com/2010/06/Session_v3"
_NS_SEC    = "http://xml.amadeus.com/2010/06/Security_v1"
_NS_WSS    = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
_NS_WSU    = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
_NS_AUTH   = "http://xml.amadeus.com/VLSSLQ_06_1_IA"
_NS_CMD    = "http://xml.amadeus.com/HSFREQ_07_3_IA"
_NS_SIGNOUT = "http://xml.amadeus.com/VLSSOQ_04_1_IA"
_NS_LINK   = "http://wsdl.amadeus.com/2010/06/ws/Link_v1"

_ACT_AUTH    = "http://webservices.amadeus.com/VLSSLQ_06_1_IA"
_ACT_CMD     = "http://webservices.amadeus.com/HSFREQ_07_3_IA"
_ACT_SIGNOUT = "http://webservices.amadeus.com/VLSSOQ_04_1_IA"

_PWD_DIGEST_TYPE = (
    "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0"
    "#PasswordDigest"
)
_NONCE_ENCODING = (
    "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0"
    "#Base64Binary"
)


def _nonce_and_digest(password: str) -> tuple[str, str, str]:
    """Return (nonce_b64, created_iso, password_digest_b64)."""
    raw_nonce = os.urandom(20)
    nonce_b64 = base64.b64encode(raw_nonce).decode()
    created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    digest_raw = hashlib.sha1(raw_nonce + created.encode() + password.encode()).digest()
    digest_b64 = base64.b64encode(digest_raw).decode()
    return nonce_b64, created, digest_b64


def _find(root: ET.Element, *tags: str) -> Optional[ET.Element]:
    """Find first matching element trying each tag in turn."""
    for tag in tags:
        el = root.find(f".//{tag}")
        if el is not None:
            return el
    return None


def _text(root: ET.Element, *tags: str, default: str = "") -> str:
    el = _find(root, *tags)
    return (el.text or default) if el is not None else default


class WSAPClient:
    """
    Stateful WSAP session: authenticate → send commands → sign out.

    Usage:
        async with WSAPClient(endpoint, username, password, office_id) as client:
            response = await client.execute_command("TJQ/SOF/D-20260101")
    """

    def __init__(self, endpoint: str, username: str, password: str, office_id: str):
        self.endpoint = endpoint.rstrip("/")
        self.username = username
        self.password = password
        self.office_id = office_id

        self._session_id: Optional[str] = None
        self._security_token: Optional[str] = None
        self._seq: int = 0

    # ------------------------------------------------------------------ #
    # Context manager
    # ------------------------------------------------------------------ #

    async def __aenter__(self):
        await self.authenticate()
        return self

    async def __aexit__(self, *_):
        await self.sign_out()

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    async def authenticate(self) -> None:
        nonce_b64, created, digest = _nonce_and_digest(self.password)
        msg_id = str(uuid.uuid4())

        envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="{_NS_SOAP}"
  xmlns:sec="{_NS_AUTH}"
  xmlns:link="{_NS_LINK}">
  <soapenv:Header>
    <add:MessageID xmlns:add="{_NS_ADDR}">{msg_id}</add:MessageID>
    <add:Action xmlns:add="{_NS_ADDR}">{_ACT_AUTH}</add:Action>
    <add:To xmlns:add="{_NS_ADDR}">{self.endpoint}</add:To>
    <link:TransactionFlowLink>
      <link:Consumer><link:UniqueID>{msg_id}</link:UniqueID></link:Consumer>
    </link:TransactionFlowLink>
    <oas:Security xmlns:oas="{_NS_WSS}">
      <oas:UsernameToken>
        <oas:Username>{html.escape(self.username)}</oas:Username>
        <oas:Nonce EncodingType="{_NONCE_ENCODING}">{nonce_b64}</oas:Nonce>
        <oas:Password Type="{_PWD_DIGEST_TYPE}">{digest}</oas:Password>
        <wsu:Created xmlns:wsu="{_NS_WSU}">{created}</wsu:Created>
      </oas:UsernameToken>
    </oas:Security>
    <AMA_SecurityHostedUser xmlns="{_NS_SEC}">
      <UserID AgentDutyCode="SU" RequestorType="U"
              PseudoCityCode="{html.escape(self.office_id)}" POS_Type="1"/>
    </AMA_SecurityHostedUser>
  </soapenv:Header>
  <soapenv:Body>
    <sec:Security_Authenticate/>
  </soapenv:Body>
</soapenv:Envelope>"""

        resp = await self._post(envelope, _ACT_AUTH)
        root = ET.fromstring(resp)

        session_id    = _text(root, f"{{{_NS_SESS}}}SessionId")
        seq           = _text(root, f"{{{_NS_SESS}}}SequenceNumber", default="1")
        security_tok  = _text(root, f"{{{_NS_SESS}}}SecurityToken")

        if not session_id:
            snippet = resp[:600]
            raise RuntimeError(f"WSAP authentication failed — no SessionId in response.\n{snippet}")

        self._session_id     = session_id
        self._security_token = security_tok
        self._seq            = int(seq)
        logger.info("WSAP authenticated: office=%s session=%s", self.office_id, session_id)

    async def execute_command(self, command: str) -> str:
        if not self._session_id:
            raise RuntimeError("WSAP session not authenticated")

        self._seq += 1
        msg_id = str(uuid.uuid4())

        envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="{_NS_SOAP}"
  xmlns:cmd="{_NS_CMD}">
  <soapenv:Header>
    <add:MessageID xmlns:add="{_NS_ADDR}">{msg_id}</add:MessageID>
    <add:Action xmlns:add="{_NS_ADDR}">{_ACT_CMD}</add:Action>
    <add:To xmlns:add="{_NS_ADDR}">{self.endpoint}</add:To>
    <Session xmlns="{_NS_SESS}" TransactionStatusCode="InSeries">
      <SessionId>{html.escape(self._session_id)}</SessionId>
      <SequenceNumber>{self._seq}</SequenceNumber>
      <SecurityToken>{html.escape(self._security_token)}</SecurityToken>
    </Session>
  </soapenv:Header>
  <soapenv:Body>
    <cmd:Command_Cryptic>
      <longFreetext>{html.escape(command)}</longFreetext>
    </cmd:Command_Cryptic>
  </soapenv:Body>
</soapenv:Envelope>"""

        resp = await self._post(envelope, _ACT_CMD)
        root = ET.fromstring(resp)

        # Response text is in <longFreetext> inside the Body
        text_el = _find(root, f"{{{_NS_CMD}}}longFreetext", "longFreetext")
        if text_el is not None and text_el.text:
            return text_el.text.strip()

        # Update sequence number from response header if present
        seq_el = _find(root, f"{{{_NS_SESS}}}SequenceNumber")
        if seq_el is not None and seq_el.text:
            self._seq = int(seq_el.text)

        return "".join(root.itertext()).strip()

    async def sign_out(self) -> None:
        if not self._session_id:
            return
        self._seq += 1
        msg_id = str(uuid.uuid4())

        envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="{_NS_SOAP}"
  xmlns:sec="{_NS_SIGNOUT}">
  <soapenv:Header>
    <add:MessageID xmlns:add="{_NS_ADDR}">{msg_id}</add:MessageID>
    <add:Action xmlns:add="{_NS_ADDR}">{_ACT_SIGNOUT}</add:Action>
    <add:To xmlns:add="{_NS_ADDR}">{self.endpoint}</add:To>
    <Session xmlns="{_NS_SESS}" TransactionStatusCode="End">
      <SessionId>{html.escape(self._session_id)}</SessionId>
      <SequenceNumber>{self._seq}</SequenceNumber>
      <SecurityToken>{html.escape(self._security_token)}</SecurityToken>
    </Session>
  </soapenv:Header>
  <soapenv:Body>
    <sec:Security_SignOut/>
  </soapenv:Body>
</soapenv:Envelope>"""

        try:
            await self._post(envelope, _ACT_SIGNOUT)
            logger.info("WSAP signed out: session=%s", self._session_id)
        except Exception as exc:
            logger.warning("WSAP sign-out error (ignored): %s", exc)
        finally:
            self._session_id     = None
            self._security_token = None
            self._seq            = 0

    # ------------------------------------------------------------------ #
    # Internal
    # ------------------------------------------------------------------ #

    async def _post(self, envelope: str, soap_action: str) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                self.endpoint,
                content=envelope.encode("utf-8"),
                headers={
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": f'"{soap_action}"',
                },
            )
        if resp.status_code >= 500:
            raise RuntimeError(f"WSAP server error {resp.status_code}: {resp.text[:400]}")
        return resp.text
