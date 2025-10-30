# Mail Auto AI System

AI-assisted email response platform that drafts human-like replies to inbound inquiries (e.g., sent to `info@`) and supports both manual approval and automatic sending workflows.

## Vision

- Deliver near-real-time responses without losing the personal tone of a human support agent.
- Empower operators with an approval UI while preserving the option to bypass manual review when full automation is desired.
- Centralize reference materials (emails, PDFs, screenshots, spreadsheets) so the AI can ground replies in company-approved knowledge.

## Core Capabilities

- Upload knowledge sources: past email threads, PDF guides, screenshots, and other reference assets that shape tone and content.
- Sync with a structured knowledge base (e.g., Google Sheets) for product data, FAQs, escalation rules, and dynamic fields.
- Generate reply drafts through an LLM that is prompted with the uploaded assets and spreadsheet knowledge.
- Provide a “human-in-the-loop” interface with:
  - `承認` button that instantly sends the draft email.
  - Toggle-able “auto-send” mode for hands-off operation.
- Allow operators to choose the “from” address per inbox or per reply.
- Support optional signatures (per user or per mailbox) with merge fields.

## Experience Overview

1. **Inbound**: Incoming inquiry is ingested (via IMAP/POP3 polling, webhook, or mail forwarding).
2. **Drafting**: The system prepares a reply using the curated knowledge base and tone references.
3. **Review** (default): Operator is notified, reviews the draft, edits if needed, and clicks `承認` to send.
4. **Auto-send** (optional): If auto mode is enabled, the draft is dispatched immediately with audit logging.

## High-Level Architecture (Proposed)

- **Mail Ingestion Layer**  
  Connect to mailbox providers (Google Workspace, Microsoft 365, custom SMTP/IMAP) to fetch new inquiries and push approved replies.

- **Knowledge Management**  
  - File storage for uploaded reference materials, with metadata and versioning.  
  - Spreadsheet integration (Google Sheets API) for dynamic knowledge rows.  
  - Vector database or retrieval index to ground AI prompts with the latest information.

- **AI Drafting Service**  
  - Prompt building that merges inquiry content, context, and retrieved knowledge.  
  - LLM provider abstraction (OpenAI, Anthropic, etc.) with configurable model settings.  
  - Tone calibration using sample emails or snippets extracted from uploaded references.

- **Workflow & Approval Engine**  
  - Tracks each inquiry’s status (`drafting`, `awaiting approval`, `sent`, `auto-sent`).  
  - Handles approval routing, auto-send toggles, and permission checks.  
  - Logs all prompts, drafts, edits, and send events for auditing.

- **Web Application**  
  - Dashboard of inbound inquiries, draft emails, and approval controls.  
  - File upload interface for reference documents.  
  - Settings pages for sender addresses, signatures, auto-send preferences, and knowledge sources.

- **Notification & Delivery**  
  - Email/SMS/push alerts when drafts need approval.  
  - Outbound mail delivery via chosen SMTP provider with DKIM/SPF alignment.  
  - Bounced mail monitoring and retry policies.

## Configuration & Customization

- **Sender Profiles**: Store multiple `from` addresses, display names, and signatures; allow per-inquiry overrides.
- **Signature Management**: Text/HTML signatures with dynamic tokens (e.g., agent name, contact info).
- **Knowledge Synchronization**: Scheduled refresh intervals for spreadsheets; manual refresh controls.
- **Auto-Send Policy**: Global or per-mailbox setting; optional confidence thresholds that still route low-confidence drafts for approval.
- **Audit Trails**: Immutable logs for compliance, including before/after drafts and approver identity.

## Security & Compliance Considerations

- Access control for uploads, settings, and approvals (role-based permissions).  
- Encryption at rest for stored knowledge assets and drafts.  
- Secure OAuth credentials management for email and spreadsheet integrations.  
- Logging and monitoring for unusual activity or failed send attempts.

## Google Workspace MVP (Apps Script)

For a fast, minimized prototype within the Google ecosystem:

1. **Gmail Label & Trigger**
   - Use a Gmail filter so inquiries to `info@` (or target mailbox) receive a label such as `INFO_INBOX`.
   - Run a time-driven Apps Script trigger (e.g., every 1–5 minutes) to scan the labeled threads.
2. **Knowledge Sources**
   - Maintain structured responses in a Google Sheet `Knowledge` tab (`key`, `content`, `tags`, etc.).
   - Optionally parse Google Drive documents (text/Docs/PDF) to supply tone or policy snippets inside the prompt.
3. **Draft Generation**
   - Apps Script assembles the inquiry context + relevant knowledge and calls Gemini 2.5 Flash via `UrlFetchApp`.
   - The AI response is saved to Gmail drafts and tracked in a `Pending` sheet with metadata (timestamp, confidence, thread ID).
4. **Approval & Send**
   - Provide a custom spreadsheet menu item (“承認して送信”) that reads the pending queue, sends the selected draft using GmailApp, and moves the row to a `Logs` sheet.
   - Support an “auto-send” flag per inquiry or globally; when enabled, skip the pending queue and dispatch immediately.
5. **Configuration**
   - Store sender aliases and signatures in a `Settings` sheet; pull them into the draft before sending.
   - Log status transitions (drafted, approved, auto-sent) for auditing inside the spreadsheet.

This MVP keeps everything inside Google Workspace, reduces deployment friction, and allows quick iteration before expanding to a broader multi-provider architecture.

## Open Questions & Next Steps

- Confirm primary email provider(s) and preferred integration method (API vs. SMTP/IMAP).  
- Decide on LLM provider(s) and hosting strategy (cloud vs. self-hosted).  
- Determine required languages, tone presets, and fallback flows.  
- Draft UI wireframes for the approval dashboard and auto-send toggles.  
- Establish MVP milestones (ingestion, draft generation, manual approval, auto-send) and testing strategy.

This README will evolve as decisions are made regarding the tech stack, infrastructure, and rollout plan.
