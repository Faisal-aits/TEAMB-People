# Work Desk PHP SDK

Official PHP SDK for integrating external applications (HRMS, Payroll, CRM, Inventory, etc.) with the **Work Desk** ticket management system.

---

## Requirements

| Requirement | Version |
|-------------|---------|
| PHP         | ≥ 7.4   |
| Extensions  | `ext-curl`, `ext-json` |
| Composer    | Any     |

---

## Installation

### Via Composer (Recommended)

```bash
composer require workdesk/sdk
```

### Manual Installation

```bash
git clone https://github.com/your-org/workdesk-sdk.git
composer install
```

---

## Quick Start

```php
<?php
require 'vendor/autoload.php';

use WorkDesk\SDK\WorkDeskClient;

$client = new WorkDeskClient(
    'https://your-workdesk-domain.com',  // Base URL
    'wdk_your_api_key_here'              // API Key from Work Desk admin
);

// Create a ticket
$result = $client->createTicket([
    'subject'      => 'Payslip not generated for March',
    'description'  => 'Employee payslip for March 2024 is missing from the portal.',
    'priority'     => 'High',
    'source_app'   => 'Payroll',
    'external_ref' => 'PAY-2024-0392',  // Your system's reference ID
]);

echo "Ticket created: " . $result['ticketId'];
```

---

## API Reference

### Constructor

```php
$client = new WorkDeskClient(string $apiUrl, string $apiKey, array $options = []);
```

**Options:**

| Option           | Type    | Default | Description                         |
|------------------|---------|---------|-------------------------------------|
| `timeout`        | int     | 30      | cURL total timeout (seconds)        |
| `connect_timeout`| int     | 10      | cURL connection timeout (seconds)   |
| `verify_ssl`     | bool    | true    | Verify SSL certificates             |
| `debug`          | bool    | false   | Print verbose cURL output           |

---

### `createTicket(array $data, ?string $attachmentPath = null): array`

Create a new support ticket.

**Required fields:**

| Field        | Type   | Description                                       |
|--------------|--------|---------------------------------------------------|
| `subject`    | string | Ticket title (alias for `title`, min 3 chars)     |
| `description`| string | Detailed description (min 5 chars)                |
| `source_app` | string | Your application name (e.g. `'HRMS'`, `'CRM'`)   |

**Optional fields:**

| Field             | Type   | Default    | Description                                     |
|-------------------|--------|------------|-------------------------------------------------|
| `priority`        | string | `'Medium'` | `'Low'`, `'Medium'`, `'High'`, `'Urgent'`       |
| `external_ref`    | string | —          | Your system's ticket/case reference ID          |
| `raised_by_email` | string | —          | Employee email to link ticket to                |
| `project_id`      | int    | —          | Work Desk project ID                            |

**Returns:** `array` with `ticketId`, `status`, `source_app`, `external_ref`

**With attachment:**

```php
$result = $client->createTicket($data, '/path/to/screenshot.png');
```

---

### `getTicket(int $id): Ticket`

Retrieve full ticket details. Returns a `Ticket` model object.

```php
$ticket = $client->getTicket(123);
echo $ticket->getTitle();
echo $ticket->getStatus();   // 'Open', 'In Progress', 'Resolved', 'Closed'
echo $ticket->getPriority(); // 'Low', 'Medium', 'High', 'Urgent'

if ($ticket->isOpen())     echo "Ticket is still open";
if ($ticket->isResolved()) echo "Ticket has been resolved";
if ($ticket->isClosed())   echo "Ticket is closed";

print_r($ticket->toArray()); // Convert to plain array
```

---

### `getTicketStatus(int $id): array`

Lightweight call that returns only status fields — faster than `getTicket()`.

```php
$status = $client->getTicketStatus(123);
echo $status['status'];     // 'Open'
echo $status['updated_at']; // '2024-01-15 10:23:45'
```

---

### `addComment(int $ticketId, string $comment): array`

Add a comment or note to a ticket.

```php
$result = $client->addComment(123, 'Investigation in progress. ETA: 2 hours.');
echo $result['commentId'];
```

---

### `uploadAttachment(int $ticketId, string $filePath): array`

Upload or replace an attachment on an existing ticket.

```php
$result = $client->uploadAttachment(123, '/path/to/error_log.pdf');
echo $result['attachmentUrl'];
```

**Supported formats:** JPEG, PNG, GIF, WebP, PDF (max 10 MB)

---

## Error Handling

The SDK uses three exception types:

```php
use WorkDesk\SDK\Exception\ApiException;
use WorkDesk\SDK\Exception\NetworkException;
use WorkDesk\SDK\Exception\WorkDeskException;

try {
    $result = $client->createTicket([...]);
} catch (ApiException $e) {
    // API returned 4xx/5xx
    echo "Status: " . $e->getStatusCode();       // e.g. 401
    echo "Message: " . $e->getApiMessage();      // Server error message
    echo "Body: " . json_encode($e->getResponseBody());
} catch (NetworkException $e) {
    // Connection failed, timeout, DNS error, TLS error
    echo "cURL error code: " . $e->getCurlErrorCode();
    echo "Message: " . $e->getMessage();
} catch (WorkDeskException $e) {
    // Catch-all for any SDK-level error
    echo "Error: " . $e->getMessage();
}
```

---

## Generating API Keys

API Keys are managed by Work Desk **Administrators** via the admin panel or CLI.

### Via Admin Panel (Recommended)

1. Log in to Work Desk as an Administrator
2. Navigate to **Settings → API Keys**
3. Click **Generate New API Key**, provide a name (e.g. `"HRMS Integration"`)
4. Copy the key — **it is only shown once**

### Via CLI (Development)

```bash
node backend/src/scripts/generateApiKey.js --tenant=1 --name="HRMS Integration"
```

### Via REST API (Admin JWT required)

```http
POST /api/admin/integration/keys
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{ "name": "HRMS Integration" }
```

---

## REST API Reference

All endpoints require `X-API-KEY` header:

```
X-API-KEY: wdk_your_api_key_here
```

| Method | Endpoint                                   | Description               |
|--------|--------------------------------------------|---------------------------|
| POST   | `/api/integration/tickets`                 | Create a ticket           |
| GET    | `/api/integration/tickets/:id`             | Get full ticket details   |
| GET    | `/api/integration/tickets/status/:id`      | Get ticket status         |
| POST   | `/api/integration/tickets/:id/comments`    | Add a comment             |
| POST   | `/api/integration/tickets/:id/attachment`  | Upload attachment         |

**Rate Limit:** 100 requests per 15-minute window per API key. Headers `X-RateLimit-Limit` and `X-RateLimit-Remaining` are included in every response.

---

## Integration Examples by Application

### HRMS Integration

```php
$client = new WorkDeskClient($url, $key);
$client->createTicket([
    'subject'      => 'Employee cannot access payroll module',
    'description'  => 'After recent HRMS update, user ID 4521 gets "Access Denied" error.',
    'priority'     => 'High',
    'source_app'   => 'HRMS',
    'external_ref' => 'HRMS-TICKET-' . $hrmsIssueId,
    'raised_by_email' => $employee->email,
]);
```

### Payroll Integration

```php
$client->createTicket([
    'subject'     => 'Payslip generation failure - ' . $month,
    'description' => "Batch payslip generation failed for department: {$dept}. Error: {$errorMsg}",
    'priority'    => 'Urgent',
    'source_app'  => 'Payroll',
    'external_ref'=> "PAY-{$batchId}",
]);
```

### Inventory / ERP Integration

```php
$client->createTicket([
    'subject'     => 'Stock discrepancy alert: ' . $sku,
    'description' => "Physical count ({$physical}) differs from system ({$system}) for SKU {$sku}.",
    'priority'    => 'Medium',
    'source_app'  => 'Inventory',
    'external_ref'=> "INV-{$reportId}",
]);
```

---

## Development & Testing

```bash
# Install dependencies
composer install

# Run tests (unit tests only — no server needed)
composer test

# Run with coverage
composer test-coverage
```

---

## Security Notes

- API Keys are tenant-scoped — a key from one company cannot access another company's tickets
- API Keys are hashed in API responses — the raw key is only shown **once** upon creation
- All external API calls are logged to `integration_audit_logs` for compliance and debugging
- Rate limiting is enforced per API key (100 req / 15 min by default)
- SSL verification is enabled by default — set `verify_ssl => false` only for local development

---

## License

MIT License — see [LICENSE](LICENSE) for details.
