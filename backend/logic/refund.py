from decimal import Decimal
from typing import Optional


class RefundRuleProtocol:
    penalty_type: str  # 'flat' or 'percentage'
    penalty_value: Decimal


def calculate_net_refund(
    total_fare: Optional[Decimal],
    base_fare: Optional[Decimal],
    tag: str,
    refund_rule: Optional[RefundRuleProtocol] = None,
) -> tuple[Decimal, Decimal]:
    """
    Returns (penalty, net_refund_amount).
    Both values are always >= 0.
    """
    total = Decimal(str(total_fare or 0))
    base = Decimal(str(base_fare or 0))
    tax = total - base

    if tag == "cancelled_before_dep" and refund_rule:
        if refund_rule.penalty_type == "flat":
            penalty = Decimal(str(refund_rule.penalty_value))
        else:
            penalty = base * (Decimal(str(refund_rule.penalty_value)) / 100)
        net_refund = max(Decimal("0"), total - penalty)
        return penalty.quantize(Decimal("0.01")), net_refund.quantize(Decimal("0.01"))

    if tag == "no_show":
        # Only taxes refundable on no-show
        penalty = base
        net_refund = max(Decimal("0"), tax)
        return penalty.quantize(Decimal("0.01")), net_refund.quantize(Decimal("0.01"))

    return Decimal("0"), Decimal("0")
