<?php

/**
 * Example: Create a ticket from an HRMS application.
 *
 * Run:
 *   WORKDESK_API_URL=http://localhost:3000 WORKDESK_API_KEY=wdk_xxx php examples/create_ticket.php
 *
 * Or copy to your project and require autoload.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use WorkDesk\SDK\WorkDeskClient;
use WorkDesk\SDK\Exception\ApiException;
use WorkDesk\SDK\Exception\NetworkException;

$apiUrl = getenv('WORKDESK_API_URL') ?: 'http://localhost:3000';
$apiKey = getenv('WORKDESK_API_KEY') ?: 'wdk_your_api_key_here';

$client = new WorkDeskClient($apiUrl, $apiKey);

try {
    // 1. Create a basic ticket
    $result = $client->createTicket([
        'subject'      => 'Login Issue in HRMS',
        'description'  => 'Employee cannot log in since 09:00 AM. Error: "Invalid credentials" even with correct password.',
        'priority'     => 'High',
        'source_app'   => 'HRMS',
        'external_ref' => 'HRMS-2024-001',
    ]);

    echo "✅ Ticket created!\n";
    echo "   Ticket ID    : " . $result['ticketId'] . "\n";
    echo "   Status       : " . $result['status'] . "\n";
    echo "   External Ref : " . ($result['external_ref'] ?? 'N/A') . "\n\n";

    $ticketId = $result['ticketId'];

    // 2. Check status
    $status = $client->getTicketStatus($ticketId);
    echo "📋 Status Check:\n";
    echo "   Status   : " . $status['status'] . "\n";
    echo "   Priority : " . $status['priority'] . "\n";
    echo "   Updated  : " . $status['updated_at'] . "\n\n";

    // 3. Get full details
    $ticket = $client->getTicket($ticketId);
    echo "🎫 Full Ticket Details:\n";
    echo "   Title       : " . $ticket->getTitle() . "\n";
    echo "   Description : " . $ticket->getDescription() . "\n";
    echo "   Source App  : " . $ticket->getSourceApp() . "\n";
    echo "   Is Open?    : " . ($ticket->isOpen() ? 'Yes' : 'No') . "\n\n";

    // 4. Add a comment
    $commentResult = $client->addComment($ticketId, 'User confirmed the issue persists. IT team has been informed.');
    echo "💬 Comment added (ID: " . $commentResult['commentId'] . ")\n\n";

    // 5. Upload an attachment (optional — only if a file exists)
    $sampleFile = __DIR__ . '/sample_screenshot.png';
    if (file_exists($sampleFile)) {
        $attachResult = $client->uploadAttachment($ticketId, $sampleFile);
        echo "📎 Attachment uploaded: " . $attachResult['attachmentUrl'] . "\n";
    } else {
        echo "ℹ️  No sample_screenshot.png found — skipping attachment upload.\n";
    }

} catch (ApiException $e) {
    echo "❌ API Error [{$e->getStatusCode()}]: " . $e->getApiMessage() . "\n";
    echo "   Full response: " . json_encode($e->getResponseBody(), JSON_PRETTY_PRINT) . "\n";
} catch (NetworkException $e) {
    echo "❌ Network Error: " . $e->getMessage() . " (cURL code: " . $e->getCurlErrorCode() . ")\n";
    echo "   Check that Work Desk is running at: {$apiUrl}\n";
} catch (\Exception $e) {
    echo "❌ Unexpected Error: " . $e->getMessage() . "\n";
}
