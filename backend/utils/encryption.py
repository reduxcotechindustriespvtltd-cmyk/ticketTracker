"""AES-256-GCM encryption for Amadeus credentials."""
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from ..config import settings


def _get_key() -> bytes:
    key = settings.AES_KEY.encode()
    # Pad or truncate to 32 bytes
    return key[:32].ljust(32, b"\x00")


def encrypt(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    payload = nonce + ciphertext
    return base64.b64encode(payload).decode()


def decrypt(token: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    payload = base64.b64decode(token.encode())
    nonce = payload[:12]
    ciphertext = payload[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()
