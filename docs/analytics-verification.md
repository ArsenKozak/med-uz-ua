# Analytics verification

Status: code-level implementation is testable locally. GTM container tags,
GA4 DebugView, Google Ads conversion actions, and production consent/legal
configuration require authenticated owner review before launch.

The browser loads Google Tag Manager through one path only:
`AnalyticsConsent.astro`. Until the visitor explicitly grants analytics
consent, no GTM script is inserted and the analytics abstraction drops every
event. Selecting “necessary only” keeps analytics disabled. Event payloads
must never contain a name, phone number, email, free text, delivery address,
Nova Poshta label/reference, or raw cart/order payload.

| Event | Trigger condition | Payload | PII review | Code-level result | GTM / Ads action |
| --- | --- | --- | --- | --- | --- |
| `phone_click` | Actual activation of a rendered `tel:` link | `placement`, `page_path`, `locale` | No PII; the telephone value is not sent | Implemented; consent-gated | Configure a GA4 event tag; decide with the owner whether this is an Ads secondary conversion |
| `appointment_submit_success` | Appointment API returns its confirmed success response | `page_path`, `locale` | No submitted fields | Implemented; consent-gated | Configure GA4 event and import/mark as the approved lead conversion |
| `appointment_submit_error` | Client validation, request, or upstream failure | stable `error_code`, `page_path`, `locale` | No submitted fields or server detail | Implemented as diagnostic only | Do not configure as a conversion |
| `add_to_cart` | Nano Stores accepts the product update | `currency: UAH`, `value`, one item with stable ID/category/price/quantity | No customer or delivery data | Implemented; consent-gated | Configure the GA4 recommended event |
| `view_cart` | The cart dialog successfully opens | aggregate `currency`, `value`, `item_count` | No titles, persisted snapshots, or customer data | Implemented; consent-gated | Configure the GA4 recommended event |

`begin_checkout`, `add_shipping_info`, `add_payment_info`, and `purchase` are
deliberately not emitted. Checkout is non-live until durable server-side order
state, verified Nova Poshta selection, and a signature-verified LiqPay callback
exist. A client click or redirect must never be counted as `purchase`.

## Owner verification before production

1. Review and publish the GTM container identified by the configured public
   container ID; confirm that the container has only the intended consent-aware
   tags and triggers.
2. Use GTM Preview / Tag Assistant and GA4 DebugView after granting consent.
   Confirm one event per action and zero analytics requests before consent.
3. Submit one valid and one invalid appointment. Confirm that only the valid,
   API-confirmed request emits `appointment_submit_success` and that no request
   contains form values.
4. Add, remove, and change product quantities, open the cart, and inspect the
   `dataLayer` payloads against the table above.
5. Configure/import Google Ads conversions only after the clinic owner approves
   which events are primary conversions. Record account/container versions and
   retain screenshots or an export outside the public repository.
