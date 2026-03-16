# WhatsApp Bridge API — Developer Integration Guide

Complete API reference for integrating WhatsApp messaging and SMS into your application. This guide is written for developers building integrations — CRMs, support tools, marketing platforms, or any app that needs to send/receive WhatsApp messages and SMS programmatically.

Everything in this guide happens through **your application's backend** calling this API. Your end users never need to visit the Bridge API dashboard or interact with it directly.

**Base URL:** `https://wa.vividverseglobal.com/api`

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Authentication](#2-authentication)
3. [WhatsApp Sessions](#3-whatsapp-sessions)
4. [Sending Messages](#4-sending-messages)
5. [Media Messages](#5-media-messages)
6. [Reading Messages & Chat History](#6-reading-messages--chat-history)
7. [Scheduled Messages](#7-scheduled-messages)
8. [Groups](#8-groups)
9. [Contacts](#9-contacts)
10. [SMS Relay](#10-sms-relay)
11. [Real-Time Events (WebSocket)](#11-real-time-events-websocket)
12. [Error Handling](#12-error-handling)
13. [Integration Patterns](#13-integration-patterns)

---

## 1. Quick Start

### Set up your tenant account

Your application is a **tenant**. Each tenant gets isolated sessions, messages, API keys, and SMS devices. Create a tenant account once, then use the returned JWT or API keys for all subsequent calls.

```bash
# 1. Create your tenant account
curl -X POST https://wa.vividverseglobal.com/api/account/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@yourapp.com",
    "password": "secure-password-here",
    "name": "Your App Name"
  }'
# Returns: { "token": "eyJhbG...", "tenant": { "id": "uuid", ... } }

# 2. Generate a permanent API key (using the JWT from step 1)
curl -X POST https://wa.vividverseglobal.com/api/account/keys \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{ "name": "Production" }'
# Returns: { "key": "wba_abc123...", ... }

# 3. Create a WhatsApp session
curl -X POST https://wa.vividverseglobal.com/api/auth/create-session \
  -H "x-api-key: wba_abc123..." \
  -H "Content-Type: application/json" \
  -d '{ "name": "Support Line" }'
# Returns: { "userId": "session-uuid", "status": "qr_ready" }

# 4. Get the QR code and display it in your app
curl https://wa.vividverseglobal.com/api/auth/qr/SESSION_UUID \
  -H "x-api-key: wba_abc123..."
# Returns: { "qr": "data:image/png;base64,...", "qrRaw": "2@..." }

# 5. After QR scan, send a message
curl -X POST https://wa.vividverseglobal.com/api/messages/send \
  -H "x-api-key: wba_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "SESSION_UUID",
    "to": "919876543210",
    "message": "Hello from your CRM!"
  }'
# Returns: { "messageId": "whatsapp-msg-id", "status": "sent" }
```

---

## 2. Authentication

Every API call (except public endpoints) requires one of these authentication methods.

### Method 1: API Key (recommended for server-to-server)

```
x-api-key: wba_abc123...
```

API keys are permanent, scoped to your tenant, and can be revoked at any time. Use these for backend integrations.

### Method 2: JWT Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

JWTs expire after 7 days (configurable). Use these for short-lived access, like when your frontend needs to call the API directly.

### Method 3: Master Admin Key

```
x-api-key: <master-key-from-env>
```

The master key (set in the server's `.env` file) grants admin access across all tenants. Only use this for admin/ops tooling.

### Public Endpoints (no auth required)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Server health check |
| `POST /api/account/signup` | Create a new tenant account |
| `POST /api/account/login` | Log in to existing tenant account |

### Tenant Account Management

#### `POST /api/account/signup`

Create a new tenant account.

```json
// Request
{
  "email": "dev@yourapp.com",
  "password": "min-6-chars",
  "name": "Your App Name"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "dev@yourapp.com",
    "name": "Your App Name",
    "role": "user"
  }
}

// Response 409 — Email already exists
{ "error": true, "message": "An account with this email already exists", "code": "INTERNAL_ERROR" }
```

#### `POST /api/account/login`

```json
// Request
{ "email": "dev@yourapp.com", "password": "your-password" }

// Response 200 — same shape as signup
{ "token": "eyJ...", "tenant": { "id": "...", ... } }

// Response 401
{ "error": true, "message": "Invalid email or password", "code": "AUTH_REQUIRED" }
```

#### `GET /api/account/me`

Get current tenant profile.

```json
// Response
{ "id": "uuid", "email": "dev@yourapp.com", "name": "Your App", "role": "user" }
```

#### `POST /api/account/keys`

Create a new API key.

```json
// Request (name is optional, defaults to "Default")
{ "name": "Production Key" }

// Response
{
  "id": "key-uuid",
  "name": "Production Key",
  "key": "wba_a1b2c3d4e5f6...",        // Full key — only shown once
  "keyPrefix": "wba_a1b2c3d4...",        // Masked version for display
  "createdAt": "2025-03-15T12:00:00Z"
}
```

> **Important:** The full `key` value is only returned at creation time. Store it securely.

#### `GET /api/account/keys`

List all API keys for your tenant. Returns masked key prefixes.

#### `DELETE /api/account/keys/:keyId`

Revoke an API key. Takes effect immediately.

---

## 3. WhatsApp Sessions

A **session** represents a linked WhatsApp account. Your app creates sessions, displays QR codes for phone linking, and then sends/receives messages through connected sessions.

### Session Lifecycle

```
create-session → QR code generated → User scans QR → Connected → Send/receive messages
                                                         ↓
                                              Auto-reconnects if disconnected
```

Sessions persist across server restarts. Once a phone scans the QR, the session stays connected 24/7 until explicitly logged out.

### Limits

Each tenant can have up to **10 active sessions** by default (configurable on the server via `MAX_SESSIONS`).

### `POST /api/auth/create-session`

Create a new WhatsApp session.

```json
// Request
{ "name": "Customer Support" }

// Response 200
{ "userId": "550e8400-e29b-41d4-a716-446655440000", "status": "qr_ready" }

// Response 429 — Session limit reached
{ "error": true, "message": "Maximum sessions (10) reached for this tenant", "code": "RATE_LIMITED" }
```

**Implementation note:** Store the `userId` — you'll need it for every subsequent API call related to this session.

### `GET /api/auth/qr/:userId`

Get the QR code for the user to scan.

```json
// Response 200
{
  "qr": "data:image/png;base64,iVBOR...",   // Base64 PNG — display as <img src="...">
  "qrRaw": "2@abc123..."                     // Raw QR string (for custom QR rendering)
}

// Response 404 — Already connected or session doesn't exist
{ "error": true, "message": "No QR code available. Session may already be connected.", "code": "SESSION_NOT_FOUND" }
```

**How to display in your app:**

```html
<!-- Direct image display -->
<img src="${response.qr}" alt="Scan with WhatsApp" />
```

```javascript
// Poll for QR until connected
async function waitForConnection(userId, apiKey) {
  while (true) {
    const status = await fetch(`/api/auth/status/${userId}`, {
      headers: { 'x-api-key': apiKey }
    }).then(r => r.json());

    if (status.status === 'connected') return status;

    // Show QR if available
    if (status.status === 'qr_ready') {
      const qr = await fetch(`/api/auth/qr/${userId}`, {
        headers: { 'x-api-key': apiKey }
      }).then(r => r.json());
      displayQR(qr.qr);
    }

    await new Promise(r => setTimeout(r, 3000)); // Poll every 3s
  }
}
```

Or use [WebSocket events](#11-real-time-events-websocket) for instant QR/connection updates instead of polling.

### `GET /api/auth/status/:userId`

Check session status.

```json
// Response 200
{
  "userId": "uuid",
  "status": "connected",       // pending | qr_ready | connected | disconnected
  "phone": "919876543210",     // null until connected
  "name": "Customer Support"
}
```

### `GET /api/auth/sessions`

List all sessions for your tenant.

```json
// Response 200
[
  { "userId": "uuid-1", "status": "connected", "phone": "919876543210", "name": "Support Line" },
  { "userId": "uuid-2", "status": "disconnected", "phone": "14155551234", "name": "Sales" }
]
```

### `POST /api/auth/logout/:userId`

Disconnect from WhatsApp and delete the session. The phone will show the linked device as removed.

```json
// Response 200
{ "success": true }
```

> **Warning:** This permanently removes the session. The user will need to re-scan a QR code to reconnect. All stored messages for this session are deleted (cascade).

---

## 4. Sending Messages

### `POST /api/messages/send`

Send a text message to an individual contact.

```json
// Request
{
  "userId": "session-uuid",       // Which WhatsApp session to send from
  "to": "919876543210",           // Recipient phone number
  "message": "Hello! Your order #1234 has shipped."
}

// Response 200
{
  "messageId": "3EB0A1B2C3D4E5F6",    // WhatsApp message ID
  "status": "sent"
}
```

**Phone number format:**
- Country code + number, digits only: `919876543210`
- With plus: `+919876543210`
- With spaces/dashes: `+91 98765 43210` (auto-cleaned)
- Already a JID: `919876543210@s.whatsapp.net` (passed through)

### Error responses

```json
// 400 — Missing fields
{ "error": true, "message": "userId, to, and message are required", "code": "INVALID_PHONE" }

// 400 — Session exists but not connected
{ "error": true, "message": "Session not connected", "code": "SESSION_NOT_CONNECTED" }

// 404 — Session doesn't exist or belongs to another tenant
{ "error": true, "message": "Session not found", "code": "SESSION_NOT_FOUND" }

// 500 — WhatsApp send failed
{ "error": true, "message": "Failed to send message", "code": "MESSAGE_FAILED" }
```

---

## 5. Media Messages

### `POST /api/messages/send-media`

Send images, videos, audio, documents, or stickers.

**Two upload methods:**

#### Method A: File Upload (multipart/form-data)

```bash
curl -X POST https://wa.vividverseglobal.com/api/messages/send-media \
  -H "x-api-key: wba_abc123..." \
  -F "userId=SESSION_UUID" \
  -F "to=919876543210" \
  -F "type=image" \
  -F "caption=Check out this product!" \
  -F "file=@/path/to/photo.jpg"
```

#### Method B: Base64 (JSON body)

```bash
curl -X POST https://wa.vividverseglobal.com/api/messages/send-media \
  -H "x-api-key: wba_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "SESSION_UUID",
    "to": "919876543210",
    "type": "image",
    "caption": "Check out this product!",
    "media": "iVBORw0KGgo..."
  }'
```

### Supported media types

| Type | Required Fields | Optional Fields | Notes |
|------|----------------|-----------------|-------|
| `image` | `file` or `media` | `caption` | JPEG, PNG, WebP |
| `video` | `file` or `media` | `caption`, `gifPlayback`, `ptv` | MP4, 3GP |
| `audio` | `file` or `media` | `ptt`, `mimetype` | MP3, OGG, M4A |
| `document` | `file` or `media` | `caption`, `filename`, `mimetype` | Any file type |
| `sticker` | `file` or `media` | — | WebP format |

### Special fields

| Field | Type | Description |
|-------|------|-------------|
| `caption` | string | Text caption (images, videos, documents) |
| `filename` | string | Display filename for documents (defaults to original filename or "file") |
| `ptt` | boolean | `true` = send as voice note (push-to-talk). Audio plays inline in chat like a voice message. |
| `gifPlayback` | boolean | `true` = video plays as a GIF (auto-loop, no sound) |
| `ptv` | boolean | `true` = video sent as a video note (circular view-once video) |
| `mimetype` | string | Override MIME type (e.g., `audio/ogg; codecs=opus` for voice notes) |

### Examples

**Send a document:**

```json
{
  "userId": "SESSION_UUID",
  "to": "919876543210",
  "type": "document",
  "caption": "Invoice for March 2025",
  "filename": "invoice-march-2025.pdf",
  "media": "<base64-encoded-pdf>"
}
```

**Send a voice note:**

```json
{
  "userId": "SESSION_UUID",
  "to": "919876543210",
  "type": "audio",
  "ptt": true,
  "media": "<base64-encoded-ogg>"
}
```

**Send a sticker:**

```json
{
  "userId": "SESSION_UUID",
  "to": "919876543210",
  "type": "sticker",
  "media": "<base64-encoded-webp>"
}
```

### Response

```json
{ "messageId": "3EB0A1B2C3D4E5F6", "status": "sent" }
```

### Size limit

Maximum request body size: **50 MB**. For very large files, use the file upload method.

---

## 6. Reading Messages & Chat History

All incoming and outgoing messages are stored in the database. You can retrieve them at any time.

### `GET /api/messages/:userId/chats`

List all conversations for a session, sorted by most recent activity.

```json
// Response 200
[
  {
    "remote_jid": "919876543210@s.whatsapp.net",
    "last_timestamp": 1710500000,
    "total_messages": 42,
    "unread_count": 3
  },
  {
    "remote_jid": "120363012345678901@g.us",
    "last_timestamp": 1710499000,
    "total_messages": 128,
    "unread_count": 0
  }
]
```

JIDs ending in `@s.whatsapp.net` are individual chats. JIDs ending in `@g.us` are group chats.

### `GET /api/messages/:userId/chat/:jid`

Get messages for a specific conversation.

**Query parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 50 | Number of messages to return |
| `before` | — | Unix timestamp — return messages before this time (for pagination) |

```bash
# Get the 50 most recent messages
GET /api/messages/SESSION_UUID/chat/919876543210@s.whatsapp.net

# Get the next page (messages before timestamp 1710499000)
GET /api/messages/SESSION_UUID/chat/919876543210@s.whatsapp.net?limit=50&before=1710499000
```

```json
// Response 200
[
  {
    "id": "msg-uuid",
    "user_id": "session-uuid",
    "remote_jid": "919876543210@s.whatsapp.net",
    "from_me": 1,                              // 1 = sent by you, 0 = received
    "message_type": "text",                    // text | image | video | audio | document | sticker | reaction | other
    "content": "Hello! Your order has shipped.",
    "media_url": null,                         // URL to media file if applicable
    "timestamp": 1710500000,                   // Unix seconds
    "message_id": "3EB0A1B2C3D4E5F6",        // WhatsApp message ID
    "status": "read",                          // pending | sent | delivered | read | played | failed | error
    "created_at": "2025-03-15T12:00:00.000Z"
  }
]
```

### Accessing media files

When `media_url` is not null, the media file is accessible at:

```
https://wa.vividverseglobal.com/media/FILENAME
```

Media URLs are relative paths. Prepend your base URL (without `/api`).

---

## 7. Scheduled Messages

Queue messages for future delivery. Powered by Redis + BullMQ with automatic retries.

### `POST /api/messages/schedule`

```json
// Request
{
  "userId": "session-uuid",
  "to": "919876543210",
  "message": "Happy Birthday! 🎂",
  "scheduledAt": "2025-12-25T10:00:00Z"      // ISO 8601 datetime (must be in the future)
}

// Response 200
{
  "scheduledId": "sched-uuid",
  "jobId": "bullmq-job-id",
  "scheduledAt": "2025-12-25T10:00:00.000Z"
}

// Response 400 — Time is in the past
{ "error": true, "message": "scheduledAt must be a valid future date", "code": "VALIDATION_ERROR" }
```

**Requirements:**
- The session must exist at scheduling time (but doesn't need to be connected)
- The session must be connected at delivery time (retries 3x with exponential backoff if not)
- `scheduledAt` must be a valid future ISO 8601 datetime

### `GET /api/messages/schedule/:userId`

Get all scheduled messages for a specific session.

```json
// Response 200
[
  {
    "id": "sched-uuid",
    "user_id": "session-uuid",
    "remote_jid": "919876543210@s.whatsapp.net",
    "message_type": "text",
    "content": "Happy Birthday! 🎂",
    "media_path": null,
    "scheduled_at": "2025-12-25T10:00:00.000Z",
    "status": "pending",                    // pending | sent | failed | cancelled
    "job_id": "bullmq-job-id",
    "created_at": "2025-03-15T12:00:00.000Z"
  }
]
```

### `GET /api/messages/scheduled/all`

Get all scheduled messages across all sessions for your tenant.

### `DELETE /api/messages/schedule/:scheduledId`

Cancel a pending scheduled message.

```json
// Response 200
{ "success": true }

// Response 400 — Already sent/failed
{ "error": true, "message": "Can only cancel pending messages", "code": "MESSAGE_FAILED" }
```

### Scheduled message status flow

```
pending → sent       (delivered successfully)
pending → failed     (3 retries exhausted — session not connected)
pending → cancelled  (manually cancelled via DELETE)
```

---

## 8. Groups

### `GET /api/groups/:userId`

List all WhatsApp groups for a connected session.

```json
// Response 200
[
  {
    "id": "120363012345678901@g.us",
    "subject": "Marketing Team",
    "desc": "Group description text",
    "owner": "919876543210@s.whatsapp.net",
    "size": 15,
    "creation": 1700000000
  }
]
```

### `GET /api/groups/:userId/:groupJid`

Get detailed group metadata including participants.

The `groupJid` can be the full JID (`120363012345678901@g.us`) or just the ID (`120363012345678901`).

```json
// Response 200
{
  "id": "120363012345678901@g.us",
  "subject": "Marketing Team",
  "desc": "Group description",
  "owner": "919876543210@s.whatsapp.net",
  "size": 15,
  "creation": 1700000000,
  "participants": [
    { "id": "919876543210@s.whatsapp.net", "admin": "superadmin" },
    { "id": "14155551234@s.whatsapp.net", "admin": "admin" },
    { "id": "447911123456@s.whatsapp.net", "admin": null }
  ]
}
```

### `POST /api/groups/:userId/:groupJid/send`

Send a text message to a group.

```json
// Request
{ "message": "Meeting at 3 PM today!" }

// Response 200
{ "messageId": "3EB0A1B2C3D4E5F6", "status": "sent" }
```

---

## 9. Contacts

### `GET /api/contacts/:userId/check/:phone`

Check if a phone number is registered on WhatsApp.

```bash
GET /api/contacts/SESSION_UUID/check/919876543210
```

```json
// Response 200 — Number is on WhatsApp
{
  "exists": true,
  "jid": "919876543210@s.whatsapp.net"
}

// Response 200 — Number is NOT on WhatsApp
{
  "exists": false,
  "jid": null
}
```

Use this to validate phone numbers before sending messages.

---

## 10. SMS Relay

The SMS relay lets you send and receive SMS through a physical Android phone. No external SMS services — fully self-hosted.

### Architecture

```
Your App → Bridge API → SMS Queue → Android Phone (polls outbox) → Carrier Network
                                                ↓
         Bridge API ← Incoming SMS report ← Android Phone
```

### Setting up SMS from your app

#### Step 1: Create a device slot

```bash
POST /api/sms/devices
```

```json
// Response 200
{
  "id": "device-uuid",
  "tenant_id": "your-tenant-uuid",
  "device_key": "dsk_a1b2c3d4e5f6...",     // Device authentication key
  "status": "pending",
  "created_at": "2025-03-15T12:00:00Z"
}
```

#### Step 2: Get setup QR for the phone

```bash
GET /api/sms/setup-qr
```

```json
// Response 200
{
  "qr": "data:image/png;base64,...",          // QR code image (display in your app)
  "url": "https://wa.vividverseglobal.com/sms-setup.html?key=dsk_...",
  "deviceKey": "dsk_a1b2c3d4e5f6...",
  "deviceId": "device-uuid"
}
```

Display the `qr` image in your application. The user scans it with their Android phone's camera, which opens the setup page to install the Bridge SMS app and configure it.

#### Step 3: Verify the device is online

```bash
GET /api/sms/health
```

```json
{ "enabled": true, "device": "online" }
```

### Sending SMS

#### `POST /api/sms/send`

```json
// Request
{
  "to": "+966501234567",
  "message": "Your verification code is 123456"
}

// Response 200
{
  "id": "sms-uuid",
  "phoneNumber": "+966501234567",
  "status": "queued"                        // Queued for the Android phone to pick up
}
```

### SMS status flow

```
queued → pending (picked up by phone) → sent → delivered
                                          ↓
                                       failed
```

### Reading SMS conversations

#### `GET /api/sms/conversations`

List all SMS conversations grouped by phone number.

```json
// Response 200
[
  {
    "phone_number": "+966501234567",
    "last_timestamp": 1710500000,
    "total_messages": 15,
    "incoming_count": 8
  }
]
```

#### `GET /api/sms/conversations/:phone`

Get messages for a specific phone number.

```bash
GET /api/sms/conversations/+966501234567?limit=50
```

```json
// Response 200
[
  {
    "id": "sms-uuid",
    "tenant_id": "tenant-uuid",
    "phone_number": "+966501234567",
    "from_me": 1,
    "content": "Your verification code is 123456",
    "gateway_message_id": "android-msg-id",
    "status": "delivered",
    "timestamp": 1710500000,
    "created_at": "2025-03-15T12:00:00Z"
  }
]
```

### Managing SMS devices

#### `GET /api/sms/devices`

List all SMS devices for your tenant.

```json
// Response 200
[
  {
    "id": "device-uuid",
    "tenant_id": "tenant-uuid",
    "device_key": "dsk_...",
    "device_id": "android-device-uuid",
    "phone_number": "+966501234567",
    "name": "",
    "status": "online",                    // pending | online | offline
    "last_seen_at": "2025-03-15T12:00:00Z",
    "created_at": "2025-03-15T11:55:00Z"
  }
]
```

Devices are marked **offline** if no heartbeat is received for 3+ minutes.

#### `DELETE /api/sms/devices/:id`

Remove a registered device.

```json
// Response 200
{ "ok": true }
```

### SMS health check

#### `GET /api/sms/health`

```json
// Device connected
{ "enabled": true, "device": "online" }

// No device or device offline
{ "enabled": true, "device": "offline" }
```

---

## 11. Real-Time Events (WebSocket)

Use Socket.IO to receive instant notifications for incoming messages, delivery status, QR codes, and SMS events. This is far more efficient than polling.

### Connecting

```javascript
import { io } from "socket.io-client";

const socket = io("https://wa.vividverseglobal.com", {
  auth: {
    apiKey: "wba_abc123..."          // or: token: "eyJhbG..."
  }
});

socket.on("connect", () => {
  console.log("Connected to Bridge API");

  // Subscribe to all sessions for your tenant
  socket.emit("subscribe", { userId: "*" });

  // Or subscribe to a specific session
  // socket.emit("subscribe", { userId: "session-uuid" });
});
```

### Events

#### `qr` — QR code available for a session

```javascript
socket.on("qr", (data) => {
  // data.userId — session UUID
  // data.qr    — base64 PNG image
  // data.qrRaw — raw QR string
  displayQRCode(data.userId, data.qr);
});
```

#### `connection` — Session connected or disconnected

```javascript
socket.on("connection", (data) => {
  // data.userId — session UUID
  // data.status — "connected" | "disconnected"
  // data.phone  — phone number (when connected)
  updateSessionStatus(data.userId, data.status);
});
```

#### `message` — Incoming WhatsApp message

```javascript
socket.on("message", (data) => {
  // data.id           — internal message UUID
  // data.user_id      — session UUID
  // data.remote_jid   — sender JID
  // data.from_me      — 0 (incoming) or 1 (outgoing)
  // data.message_type — text | image | video | audio | document | sticker | reaction | other
  // data.content      — message text or caption
  // data.media_url    — path to media file (if applicable)
  // data.timestamp    — Unix seconds
  // data.message_id   — WhatsApp message ID
  // data.status       — message status
  handleIncomingMessage(data);
});
```

#### `message:status` — Delivery status update

```javascript
socket.on("message:status", (data) => {
  // data.userId    — session UUID
  // data.messageId — WhatsApp message ID
  // data.status    — "sent" | "delivered" | "read" | "played"
  updateMessageStatus(data.messageId, data.status);
});
```

Status progression: `pending → sent → delivered → read → played`

Statuses only move forward — you'll never receive a "sent" event after a "read" event.

#### `message:reaction` — Reaction on a message

```javascript
socket.on("message:reaction", (data) => {
  // data.userId    — session UUID
  // data.messageId — WhatsApp message ID of the reacted-to message
  // data.reaction  — emoji string (e.g. "👍") or empty string (reaction removed)
  // data.from      — JID of the person who reacted
  showReaction(data.messageId, data.reaction, data.from);
});
```

#### `scheduled:sent` — Scheduled message delivered

```javascript
socket.on("scheduled:sent", (data) => {
  // data.scheduledId — scheduled message UUID
  // data.messageId   — WhatsApp message ID
  // data.status      — "sent"
});
```

#### `scheduled:failed` — Scheduled message failed

```javascript
socket.on("scheduled:failed", (data) => {
  // data.scheduledId — scheduled message UUID
  // data.error       — error message string
});
```

#### `sms:received` — Incoming SMS

```javascript
socket.on("sms:received", (data) => {
  // data.id           — SMS record UUID
  // data.phone_number — sender phone number
  // data.content      — message text
  // data.timestamp    — Unix seconds
  handleIncomingSMS(data);
});
```

#### `sms:status` — SMS delivery status

```javascript
socket.on("sms:status", (data) => {
  // data.id          — SMS record UUID
  // data.status      — "sent" | "delivered" | "failed"
  // data.phoneNumber — recipient phone number
  // data.error       — error message (if failed)
  updateSMSStatus(data.id, data.status);
});
```

### Unsubscribing

```javascript
socket.emit("unsubscribe", { userId: "*" });
// or
socket.emit("unsubscribe", { userId: "specific-session-uuid" });
```

### Late authentication

If you can't provide credentials at connection time, you can authenticate after connecting:

```javascript
const socket = io("https://wa.vividverseglobal.com");

socket.on("connect", () => {
  socket.emit("authenticate", { apiKey: "wba_abc123..." });
});

socket.on("authenticated", (result) => {
  if (result.success) {
    socket.emit("subscribe", { userId: "*" });
  }
});
```

> **Note:** You have 5 seconds to authenticate after connecting, or you'll be disconnected.

---

## 12. Error Handling

All errors follow a consistent format:

```json
{
  "error": true,
  "message": "Human-readable description",
  "code": "ERROR_CODE"
}
```

### Error codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_REQUIRED` | 401 | Missing or invalid credentials |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `SESSION_NOT_FOUND` | 404 | Session/resource doesn't exist or belongs to another tenant |
| `SESSION_NOT_CONNECTED` | 400 | Session exists but WhatsApp is not connected |
| `INVALID_PHONE` | 400 | Invalid phone number or missing required fields |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `MESSAGE_FAILED` | 500 | Failed to send or process message |
| `RATE_LIMITED` | 429 | Too many requests or max sessions reached |
| `NOT_IMPLEMENTED` | 501 | Feature not available |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Rate limiting

The API enforces **100 requests per minute per IP address**. When exceeded, you'll receive HTTP 429.

---

## 13. Integration Patterns

### Pattern: CRM WhatsApp Integration

Your CRM users connect their WhatsApp and message customers directly from the CRM.

```
CRM User Dashboard
├── "Connect WhatsApp" button
│   └── POST /auth/create-session → display QR from GET /auth/qr/:userId
│
├── Contact View
│   ├── Message history: GET /messages/:userId/chat/:jid
│   ├── Send message: POST /messages/send
│   └── Send attachment: POST /messages/send-media
│
├── Inbox (real-time)
│   └── WebSocket: listen for "message" events
│
└── Scheduled Follow-ups
    └── POST /messages/schedule
```

**Key flow — connecting WhatsApp in your CRM:**

```javascript
// 1. User clicks "Connect WhatsApp" in your CRM
const session = await api.post('/auth/create-session', {
  name: `${user.name}'s WhatsApp`
});
const userId = session.userId;

// 2. Display QR code in your CRM's UI
const qr = await api.get(`/auth/qr/${userId}`);
showQRModal(qr.qr);  // Show the base64 PNG

// 3. Listen for connection via WebSocket
socket.on('connection', (data) => {
  if (data.userId === userId && data.status === 'connected') {
    closeQRModal();
    showSuccess(`WhatsApp connected: ${data.phone}`);
    saveSessionToDatabase(userId, data.phone);
  }
});

// 4. Send messages from your CRM
await api.post('/messages/send', {
  userId: savedUserId,
  to: contact.phone,
  message: `Hi ${contact.name}, your appointment is confirmed for tomorrow at 3 PM.`
});
```

### Pattern: Notification Service

Send transactional WhatsApp messages (order updates, OTPs, reminders).

```javascript
// Your notification service
class WhatsAppNotifier {
  constructor(apiKey, sessionUserId, baseUrl) {
    this.apiKey = apiKey;
    this.userId = sessionUserId;
    this.base = baseUrl;
  }

  async sendText(phone, message) {
    return fetch(`${this.base}/api/messages/send`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        to: phone,
        message
      })
    }).then(r => r.json());
  }

  async sendDocument(phone, fileBuffer, filename, caption) {
    return fetch(`${this.base}/api/messages/send-media`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        to: phone,
        type: 'document',
        filename,
        caption,
        media: fileBuffer.toString('base64')
      })
    }).then(r => r.json());
  }

  async scheduleReminder(phone, message, sendAt) {
    return fetch(`${this.base}/api/messages/schedule`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        to: phone,
        message,
        scheduledAt: sendAt.toISOString()
      })
    }).then(r => r.json());
  }
}

// Usage
const wa = new WhatsAppNotifier('wba_abc123...', 'session-uuid', 'https://wa.vividverseglobal.com');
await wa.sendText('+919876543210', 'Your order #5678 has been shipped!');
await wa.sendDocument('+919876543210', pdfBuffer, 'invoice.pdf', 'Invoice for Order #5678');
await wa.scheduleReminder('+919876543210', 'Reminder: Your appointment is tomorrow!', tomorrowAt9AM);
```

### Pattern: Two-Way Chat Support

Build a helpdesk where agents chat with customers via WhatsApp.

```javascript
// Connect to WebSocket for real-time messages
const socket = io('https://wa.vividverseglobal.com', {
  auth: { apiKey: 'wba_abc123...' }
});

socket.on('connect', () => {
  socket.emit('subscribe', { userId: '*' });
});

// Incoming customer message → create support ticket
socket.on('message', async (msg) => {
  if (msg.from_me) return;  // Skip our own messages

  const phone = msg.remote_jid.replace('@s.whatsapp.net', '');
  const ticket = await findOrCreateTicket(phone);

  // Add message to ticket
  await addMessageToTicket(ticket.id, {
    from: 'customer',
    text: msg.content,
    mediaUrl: msg.media_url ? `https://wa.vividverseglobal.com/media/${msg.media_url}` : null,
    timestamp: msg.timestamp
  });

  // Notify agent
  notifyAgent(ticket.assignedTo, 'New message from ' + phone);
});

// Agent replies → send via API
async function agentReply(sessionUserId, customerPhone, message) {
  return fetch('https://wa.vividverseglobal.com/api/messages/send', {
    method: 'POST',
    headers: {
      'x-api-key': 'wba_abc123...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: sessionUserId,
      to: customerPhone,
      message
    })
  });
}

// Track delivery status
socket.on('message:status', (data) => {
  updateTicketMessageStatus(data.messageId, data.status);
  // Show "delivered", "read" indicators in agent UI
});
```

### Pattern: SMS + WhatsApp Fallback

Send via WhatsApp first, fall back to SMS if the number isn't on WhatsApp.

```javascript
async function sendWithFallback(sessionUserId, phone, message, apiKey) {
  const base = 'https://wa.vividverseglobal.com/api';
  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

  // 1. Check if number is on WhatsApp
  const check = await fetch(`${base}/contacts/${sessionUserId}/check/${phone}`, { headers })
    .then(r => r.json());

  if (check.exists) {
    // 2a. Send via WhatsApp
    return fetch(`${base}/messages/send`, {
      method: 'POST', headers,
      body: JSON.stringify({ userId: sessionUserId, to: phone, message })
    }).then(r => r.json());
  } else {
    // 2b. Fall back to SMS
    return fetch(`${base}/sms/send`, {
      method: 'POST', headers,
      body: JSON.stringify({ to: phone, message })
    }).then(r => r.json());
  }
}
```

---

## Appendix: Full Endpoint Reference

### Public Endpoints (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/account/signup` | Create tenant account |
| POST | `/api/account/login` | Log in |
| GET | `/api/sms/setup-info` | SMS device setup info |
| GET | `/api/sms/download-apk` | Download SMS Android app |

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account/me` | Get current profile |
| GET | `/api/account/keys` | List API keys |
| POST | `/api/account/keys` | Create API key |
| DELETE | `/api/account/keys/:keyId` | Revoke API key |

### WhatsApp Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/create-session` | Create WhatsApp session |
| GET | `/api/auth/qr/:userId` | Get QR code |
| GET | `/api/auth/status/:userId` | Get session status |
| GET | `/api/auth/sessions` | List all sessions |
| POST | `/api/auth/logout/:userId` | Logout & delete session |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/send` | Send text message |
| POST | `/api/messages/send-media` | Send media message |
| GET | `/api/messages/:userId/chats` | List conversations |
| GET | `/api/messages/:userId/chat/:jid` | Get chat messages |

### Scheduled Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/schedule` | Schedule a message |
| GET | `/api/messages/schedule/:userId` | Get scheduled for user |
| GET | `/api/messages/scheduled/all` | Get all scheduled |
| DELETE | `/api/messages/schedule/:scheduledId` | Cancel scheduled |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups/:userId` | List groups |
| GET | `/api/groups/:userId/:groupJid` | Group details |
| POST | `/api/groups/:userId/:groupJid/send` | Send to group |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts/:userId/check/:phone` | Check WhatsApp registration |

### SMS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sms/send` | Send SMS |
| GET | `/api/sms/conversations` | List SMS conversations |
| GET | `/api/sms/conversations/:phone` | Get SMS messages |
| GET | `/api/sms/devices` | List SMS devices |
| POST | `/api/sms/devices` | Create device slot |
| DELETE | `/api/sms/devices/:id` | Remove device |
| GET | `/api/sms/health` | Check SMS status |
| GET | `/api/sms/setup-qr` | Get device setup QR |
