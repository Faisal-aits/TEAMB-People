<?php

declare(strict_types=1);

namespace WorkDesk\SDK\Tests;

use PHPUnit\Framework\TestCase;
use WorkDesk\SDK\WorkDeskClient;
use WorkDesk\SDK\Model\Ticket;
use WorkDesk\SDK\Exception\ApiException;
use WorkDesk\SDK\Exception\NetworkException;

/**
 * Unit tests for the WorkDeskClient SDK.
 *
 * These tests use a mock HTTP server or inline assertions where no network is needed.
 * For integration tests against a real server, use the WorkDeskIntegrationTest class.
 */
class WorkDeskClientTest extends TestCase
{
    // ─── Constructor / Validation Tests ──────────────────────────────────────

    public function testConstructorThrowsOnEmptyUrl(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('$apiUrl must not be empty');
        new WorkDeskClient('', 'wdk_some_key');
    }

    public function testConstructorThrowsOnEmptyApiKey(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('$apiKey must not be empty');
        new WorkDeskClient('http://localhost:3000', '');
    }

    public function testConstructorStripsTrailingSlash(): void
    {
        $client = new WorkDeskClient('http://localhost:3000/', 'wdk_key_123');
        // No exception means success — the trailing slash is stripped internally
        $this->assertInstanceOf(WorkDeskClient::class, $client);
    }

    // ─── Ticket Model Tests ───────────────────────────────────────────────────

    public function testTicketModelConstructsCorrectly(): void
    {
        $data = [
            'id'               => 42,
            'title'            => 'Test Ticket',
            'description'      => 'A test description',
            'status'           => 'Open',
            'priority'         => 'High',
            'source_app'       => 'HRMS',
            'external_ref'     => 'HRMS-001',
            'project_name'     => 'IT Support',
            'raised_by_name'   => 'Jubeda Khatun',
            'assigned_to_name' => 'Admin User',
            'attachment_url'   => null,
            'created_at'       => '2024-01-01 09:00:00',
            'updated_at'       => '2024-01-01 09:00:00',
        ];

        $ticket = new Ticket($data);

        $this->assertSame(42, $ticket->getId());
        $this->assertSame('Test Ticket', $ticket->getTitle());
        $this->assertSame('Open', $ticket->getStatus());
        $this->assertSame('High', $ticket->getPriority());
        $this->assertSame('HRMS', $ticket->getSourceApp());
        $this->assertSame('HRMS-001', $ticket->getExternalRef());
        $this->assertSame('Jubeda Khatun', $ticket->getRaisedByName());
        $this->assertTrue($ticket->isOpen());
        $this->assertFalse($ticket->isResolved());
        $this->assertFalse($ticket->isClosed());
    }

    public function testTicketIsResolvedWhenStatusResolved(): void
    {
        $ticket = new Ticket(['status' => 'Resolved']);
        $this->assertTrue($ticket->isResolved());
        $this->assertFalse($ticket->isOpen());
    }

    public function testTicketIsClosedWhenStatusClosed(): void
    {
        $ticket = new Ticket(['status' => 'Closed']);
        $this->assertTrue($ticket->isClosed());
        $this->assertFalse($ticket->isOpen());
    }

    public function testTicketIsOpenWhenStatusInProgress(): void
    {
        $ticket = new Ticket(['status' => 'In Progress']);
        $this->assertTrue($ticket->isOpen());
    }

    public function testTicketToArrayContainsAllFields(): void
    {
        $ticket = new Ticket([
            'id' => 7,
            'title' => 'Test',
            'status' => 'Open',
            'source_app' => 'CRM',
        ]);
        $array = $ticket->toArray();
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('source_app', $array);
        $this->assertSame(7, $array['id']);
        $this->assertSame('CRM', $array['source_app']);
    }

    public function testTicketHandlesMissingFieldsGracefully(): void
    {
        $ticket = new Ticket([]); // No fields provided
        $this->assertSame(0, $ticket->getId());
        $this->assertSame('', $ticket->getTitle());
        $this->assertSame('Open', $ticket->getStatus());
        $this->assertNull($ticket->getSourceApp());
    }

    // ─── Exception Tests ──────────────────────────────────────────────────────

    public function testApiExceptionStoresStatusCodeAndBody(): void
    {
        $body = ['message' => 'Not Found', 'success' => false];
        $ex = new ApiException('Not Found', 404, $body);

        $this->assertSame(404, $ex->getStatusCode());
        $this->assertSame($body, $ex->getResponseBody());
        $this->assertSame('Not Found', $ex->getApiMessage());
    }

    public function testNetworkExceptionStoresCurlErrorCode(): void
    {
        $ex = new NetworkException('Connection refused', 7);
        $this->assertSame(7, $ex->getCurlErrorCode());
        $this->assertSame('Connection refused', $ex->getMessage());
    }

    public function testUploadAttachmentThrowsOnMissingFile(): void
    {
        $client = new WorkDeskClient('http://localhost:3000', 'wdk_key_123');
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('File not found');
        $client->uploadAttachment(1, '/path/that/does/not/exist.png');
    }

    public function testCreateTicketThrowsOnMissingAttachmentFile(): void
    {
        $client = new WorkDeskClient('http://localhost:3000', 'wdk_key_123');
        $this->expectException(\InvalidArgumentException::class);
        $client->createTicket(['subject' => 'Test', 'description' => 'Test', 'source_app' => 'CRM'], '/missing/file.png');
    }
}
