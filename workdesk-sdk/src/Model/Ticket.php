<?php

declare(strict_types=1);

namespace WorkDesk\SDK\Model;

/**
 * Value object representing a Work Desk Ticket.
 * Immutable — all properties are read-only via public getters.
 */
final class Ticket
{
    private int $id;
    private string $title;
    private string $description;
    private string $status;
    private string $priority;
    private ?string $sourceApp;
    private ?string $externalRef;
    private ?string $projectName;
    private ?string $raisedByName;
    private ?string $assignedToName;
    private ?string $attachmentUrl;
    private string $createdAt;
    private string $updatedAt;

    /** @param array<string,mixed> $data Raw API response data array */
    public function __construct(array $data)
    {
        $this->id             = (int) ($data['id'] ?? 0);
        $this->title          = (string) ($data['title'] ?? '');
        $this->description    = (string) ($data['description'] ?? '');
        $this->status         = (string) ($data['status'] ?? 'Open');
        $this->priority       = (string) ($data['priority'] ?? 'Medium');
        $this->sourceApp      = $data['source_app'] ?? null;
        $this->externalRef    = $data['external_ref'] ?? null;
        $this->projectName    = $data['project_name'] ?? null;
        $this->raisedByName   = $data['raised_by_name'] ?? null;
        $this->assignedToName = $data['assigned_to_name'] ?? null;
        $this->attachmentUrl  = $data['attachment_url'] ?? null;
        $this->createdAt      = (string) ($data['created_at'] ?? '');
        $this->updatedAt      = (string) ($data['updated_at'] ?? '');
    }

    public function getId(): int           { return $this->id; }
    public function getTitle(): string     { return $this->title; }
    public function getDescription(): string { return $this->description; }
    public function getStatus(): string    { return $this->status; }
    public function getPriority(): string  { return $this->priority; }
    public function getSourceApp(): ?string   { return $this->sourceApp; }
    public function getExternalRef(): ?string { return $this->externalRef; }
    public function getProjectName(): ?string   { return $this->projectName; }
    public function getRaisedByName(): ?string  { return $this->raisedByName; }
    public function getAssignedToName(): ?string { return $this->assignedToName; }
    public function getAttachmentUrl(): ?string  { return $this->attachmentUrl; }
    public function getCreatedAt(): string { return $this->createdAt; }
    public function getUpdatedAt(): string { return $this->updatedAt; }

    public function isOpen(): bool     { return in_array($this->status, ['Open', 'In Progress'], true); }
    public function isResolved(): bool { return $this->status === 'Resolved'; }
    public function isClosed(): bool   { return $this->status === 'Closed'; }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'description'      => $this->description,
            'status'           => $this->status,
            'priority'         => $this->priority,
            'source_app'       => $this->sourceApp,
            'external_ref'     => $this->externalRef,
            'project_name'     => $this->projectName,
            'raised_by_name'   => $this->raisedByName,
            'assigned_to_name' => $this->assignedToName,
            'attachment_url'   => $this->attachmentUrl,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
