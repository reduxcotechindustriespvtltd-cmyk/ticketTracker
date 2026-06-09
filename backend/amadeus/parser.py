"""Screen parsers for Amadeus terminal responses."""
import re
from typing import Optional


def parse_twd_response(screen_text: str) -> dict:
    """Parse TWD (Ticket Wallet Display) screen output."""
    result: dict = {}

    # Passenger name: e.g. "1. SAXENA/DEVANSH"
    name_match = re.search(r"\d+\.\s*([A-Z]+/[A-Z]+)", screen_text)
    if name_match:
        result["passenger_name"] = name_match.group(1)

    # Ticket number
    tkt_match = re.search(r"TKT\s*[:\-]?\s*(\d{13})", screen_text)
    if tkt_match:
        result["ticket_number"] = tkt_match.group(1)

    # Issue date
    issue_match = re.search(r"ISSUE\s*DATE[:\s]+(\d{2}[A-Z]{3}\d{2,4})", screen_text)
    if issue_match:
        result["issue_date"] = issue_match.group(1)

    # Coupon lines
    coupon_pattern = re.compile(
        r"(\d+)\s+([A-Z]{3})\s+([A-Z]{2})\s+(\d+)\s+([A-Z])\s+"
        r"(\d{2}[A-Z]{3})\s+(\d{4})\s+([A-Z]{1,2})\s+"
        r"(AVAILABLE|USED|NO-SHOW|FLOWN|OPEN|VOID|REFUNDED|AIRPORT CONTROL)"
    )
    result["coupons"] = []
    for m in coupon_pattern.finditer(screen_text):
        result["coupons"].append(
            {
                "segment": m.group(1),
                "origin": m.group(2),
                "carrier": m.group(3),
                "flight": m.group(4),
                "class": m.group(5),
                "date": m.group(6),
                "time": m.group(7),
                "status_code": m.group(8),
                "status_text": m.group(9),
            }
        )

    # Coupon status fallback — plain status line
    status_match = re.search(r"STATUS\s*[:\-]?\s*([A-Z]{1,2})\b", screen_text)
    if status_match and not result["coupons"]:
        result["coupon_status"] = status_match.group(1)

    # FARE line: e.g. "FARE INR 5000"
    fare_match = re.search(r"FARE\s+([A-Z]{3})\s+([\d,]+\.?\d*)", screen_text)
    if fare_match:
        result["currency"] = fare_match.group(1)
        result["base_fare"] = float(fare_match.group(2).replace(",", ""))

    # TAX line
    tax_match = re.search(r"TAX\s+([A-Z]{3})\s+([\d,]+\.?\d*)", screen_text)
    if tax_match:
        result["tax_amount"] = float(tax_match.group(2).replace(",", ""))

    # TOTAL / TOT line
    tot_match = re.search(r"(?:TOT|TOTAL)\s+([A-Z]{3})\s+([\d,]+\.?\d*)", screen_text)
    if tot_match:
        result["total_fare"] = float(tot_match.group(2).replace(",", ""))

    # Fare basis code
    fb_match = re.search(r"FARE\s*BASIS[:\s]+([A-Z0-9/]+)", screen_text)
    if fb_match:
        result["fare_basis_code"] = fb_match.group(1)

    # Origin/Destination from route line e.g. "BOM-DXB"
    route_match = re.search(r"\b([A-Z]{3})-([A-Z]{3})\b", screen_text)
    if route_match:
        result["origin"] = route_match.group(1)
        result["destination"] = route_match.group(2)
        result["route"] = f"{route_match.group(1)}-{route_match.group(2)}"

    # PNR locator
    pnr_match = re.search(r"\bRLOC[:\s]+([A-Z0-9]{6})\b", screen_text)
    if pnr_match:
        result["pnr_locator"] = pnr_match.group(1)

    return result


def parse_pnr_history(screen_text: str) -> dict:
    """Parse RH (PNR History) to extract cancellation timestamp."""
    result: dict = {}

    # e.g. "XN BOM 14MAR24/1430Z SAXENA"
    cancel_match = re.search(
        r"(?:XN|CXLD?|CANCEL(?:LED)?)\s+\w+\s+(\d{2}[A-Z]{3}\d{2,4})/(\d{4})",
        screen_text,
        re.IGNORECASE,
    )
    if cancel_match:
        result["cancelled_date_raw"] = cancel_match.group(1)
        result["cancelled_time_raw"] = cancel_match.group(2)

    return result


def parse_fare_rules(screen_text: str) -> dict:
    """Parse FQD + FQN*PE penalty screen."""
    result: dict = {}

    # Flat penalty: e.g. "PENALTY USD 250.00"
    flat_match = re.search(r"PENALTY\s+[A-Z]{3}\s+([\d,]+\.?\d*)", screen_text)
    if flat_match:
        result["penalty_type"] = "flat"
        result["penalty_value"] = float(flat_match.group(1).replace(",", ""))

    # Percentage penalty: e.g. "25 PERCENT OF FARE"
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:PCT|PERCENT)\s+OF\s+(?:BASE\s+)?FARE", screen_text)
    if pct_match:
        result["penalty_type"] = "percentage"
        result["penalty_value"] = float(pct_match.group(1))

    # Refund window
    window_match = re.search(r"REFUND\s+(?:WITHIN\s+)?(\d+)\s+DAYS?", screen_text, re.IGNORECASE)
    if window_match:
        result["refund_window_days"] = int(window_match.group(1))

    return result


def parse_tjq_response(screen_text: str) -> list[str]:
    """Extract ticket numbers from TJQ (sales query) screen."""
    return re.findall(r"\b(\d{13})\b", screen_text)


def parse_rtd_response(screen_text: str) -> list[str]:
    """Extract ticket numbers from RTD (archived retrieval) screen."""
    return re.findall(r"\b(\d{13})\b", screen_text)


def map_status_text_to_code(status_text: str) -> Optional[str]:
    mapping = {
        "OPEN": "O",
        "AVAILABLE": "O",
        "NO-SHOW": "NS",
        "FLOWN": "F",
        "USED": "F",
        "VOID": "V",
        "REFUNDED": "R",
        "AIRPORT CONTROL": "A",
        "EXCHANGED": "E",
    }
    return mapping.get(status_text.upper())
