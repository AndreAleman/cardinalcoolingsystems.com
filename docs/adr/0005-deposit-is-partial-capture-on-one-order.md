---
status: accepted
---
# A Deposit is a partial payment on a single Order, not a separate Order

For Orders at or over the Deposit Threshold we considered splitting into a "deposit" Order and a "balance" Order. We chose one Order for the full total, with the Deposit recorded as a 50% payment against it and the remainder shown as outstanding; the Balance Invoice is generated from that outstanding amount. One Order keeps shipping, tax, and reporting whole at the cost of a custom payment step instead of Medusa's default full-capture checkout.
