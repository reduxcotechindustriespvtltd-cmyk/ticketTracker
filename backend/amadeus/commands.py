"""All Amadeus command string templates."""

COMMANDS = {
    "ticket_display": "TWD/TKT{ticket_number}",
    "pnr_retrieve": "RT {pnr_locator}",
    "pnr_history": "RH",
    "purged_pnr_by_ticket": "RPP/TKT-{ticket_number}",
    "purged_pnr_by_locator": "RPP/RLC-{pnr_locator}",
    "fare_rules_historical": "FQD{origin}{destination}/A{carrier}/D{issue_date}/R,{issue_date}",
    "penalty_category": "FQN{line_number}*PE",
    "sales_query_date": "TJQ/SOF/D-{date}",   # Max 62 days back
    "archived_retrieval": "RTD/D-{date}",       # For 12+ months
}


def build_command(name: str, **kwargs) -> str:
    template = COMMANDS[name]
    return template.format(**kwargs)
