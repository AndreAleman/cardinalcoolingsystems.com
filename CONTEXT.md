# Cardinal Cooling Systems — Commerce

Cardinal sells cooling and metal components to business buyers (data-center liquid cooling today; food processing next). This context covers how those buyers get accounts, see their prices, and place orders or quote requests.

## Language

### Accounts

**Company**:
A business that buys from Cardinal. Owns its Team, its Price List, and its orders.
_Avoid_: Client, account, tenant, organization

**Team Member**:
A person who belongs to a Company and can sign in to the Dashboard. Has exactly one Role.
_Avoid_: Employee, user, contact

**Role**:
What a Team Member may do: `member`, `manager`, or `admin`. Today every new Team Member is `admin`; the other two exist for later.

**Pending Company**:
A Company that has signed up but Cardinal has not yet approved. Its Team Members can sign in but the Dashboard is locked.
_Avoid_: Unverified, inactive

**Approved Company**:
A Company that Cardinal has switched on. Its Dashboard is unlocked. Never flipped back.

**Declined Company**:
A Company Cardinal has turned down. Its Team Members can still shop the public site. Cardinal may later reinstate it as Approved.
_Avoid_: Rejected, blocked

**Invite**:
An email a Team Member sends to a coworker so they can join the Company.

**Dashboard**:
The single page where a Team Member orders everything: quick order, PO upload, order again, recent orders, quotes, team.
_Avoid_: Portal, account page, customer area

### Pricing

**Price List**:
The set of prices a Company sees. Every Company has one; new Companies get the Standard list.
_Avoid_: Customer group pricing, tier pricing

**Spend Tier**:
A level (Standard, Silver, Gold) a Company reaches by calendar-year spend: Silver at $10,000, Gold at $25,000. Tiers reset on January 1.

**Tier Discount**:
What a Spend Tier is worth. On the Standard Price List: Silver 3%, Gold 6%. On a Custom Price List: Silver 1%, Gold 2%, applied on top of the custom prices.

**Custom Price List**:
A Price List Cardinal has set by hand for one Company.
_Avoid_: Negotiated pricing, special pricing

### Buying

**Quick Order**:
The table at the top of the Dashboard where a Team Member types part numbers and quantities and sees price and stock per line.
_Avoid_: Order form, bulk order

**Order Line**:
One part and one quantity in the Quick Order table.

**Buyable Line**:
An Order Line whose quantity is at or under the stock on hand. It shows a price and can be paid for.

**Quote-Only Line**:
An Order Line whose quantity is over the stock on hand (including zero stock). It cannot be paid for; it can only go into a Quote Request.

**Quote Request**:
A list of Order Lines a Team Member sends to Cardinal to be priced. Cardinal answers with a Quote.
_Avoid_: RFQ, quote, inquiry, contact form

**Quote**:
Cardinal's priced answer to a Quote Request. The Company accepts or rejects it; accepting places an order.

**Quote Message**:
A note either side writes on a Quote, e.g. asking for a lower price. Cardinal may answer by sending a revised Quote.
_Avoid_: Comment, negotiation

**PO Upload**:
A purchase-order document (PDF or image) a Team Member drops on the Dashboard. Cardinal reads it and fills the Quick Order table for them to check.

**PO Read-Out**:
The on-screen table of what Cardinal read from a PO Upload, shown to the buyer to check before paying or quoting. Prices shown are always Cardinal's, never the PO's.

**Price Alarm**:
A warning on a PO Read-Out line where the PO's price is lower than the Company's price. A PO price that is higher is silently replaced with the Company's price.

**Order**:
Order Lines the Company has committed to buy. Under the Deposit Threshold it is paid in full by card. At or over it, it is paid by Deposit plus Balance Invoice.
_Avoid_: Purchase, checkout

**Deposit Threshold**:
The order total ($10,000) at and above which an Order is paid by Deposit and Balance Invoice instead of in full.

**Deposit**:
Half of an Order's total, paid up front by card or ACH.

**Balance Invoice**:
The invoice for the other half of an Order, sent after the Deposit and paid later.

**ACH**:
A bank-transfer payment made through a Stripe invoice, outside the site. Choosing ACH places the Order as awaiting payment.

**PO Number**:
The buyer's own purchase-order reference, recorded on an Order or Quote Request.

**Favorite**:
A part a Team Member has starred for quick reuse. Belongs to the person, not the Company.

**Order Again**:
Parts from a Company's past Orders, offered on the Dashboard for one-click reuse.
_Avoid_: Reorder, previously purchased, buy again

### Approvals & Limits

**Approval**:
An `admin` Team Member's sign-off on an Order placed by a `member`, required only when the Company's Approval Setting is on.

**Approval Setting**:
A per-Company switch: "orders from members need admin approval."

**Spending Limit**:
The most a Team Member may spend in a Reset Window. Zero means no limit.

**Reset Window**:
How often a Spending Limit starts over: never, daily, weekly, monthly, or yearly.

### Incentives

**Welcome Code**:
A 10%-off code a Company receives on signup. One per Company, works once, any order size, expires in 30 days.

**Win-Back Code**:
A 10%-off code sent to a Company that has not ordered in 60 days, valid on the next Order of $200 or more.

**Referral**:
A Team Member's invitation to someone at another Company. When that new Company's first Order is $1,500 or more, the referring Company receives a Referral Code. The new Company gets nothing beyond its Welcome Code.

**Referral Code**:
A $100-off code for the referring Company. Works once, on an Order of $500 or more, expires in 90 days.

**Reorder Nudge**:
A reminder that a Company usually orders a part on a cadence and is past due.
