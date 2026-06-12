<?php

declare(strict_types=1);

namespace WorkDesk\SDK;

use WorkDesk\SDK\Exception\ApiException;
use WorkDesk\SDK\Exception\NetworkException;
use WorkDesk\SDK\Model\Ticket;

/**
 * WorkDeskClient — Main entry point for the Work Desk External Integration SDK.
 *
 * Usage:
 *   $client = new WorkDeskClient('https://your-workdesk.com', 'wdk_your_api_key');
 *   $result = $client->createTicket([
 *       'subject'     => 'Login Issue',
 *       'description' => 'Unable to login since today morning.',
 *       'priority'    => 'High',
 *       'source_app'  => 'HRMS',
 *   ]);
 *   echo $result['ticketId'];
 *
 * @package WorkDesk\SDK
 * @version 1.0.0
 */
class WorkDeskClient
{
    private const API_VERSION    = 'v1';
    private const TIMEOUT        = 30;
    private const CONNECT_TIMEOUT = 10;
    private const BASE_PATH      = '/api/integration';

    private string $apiUrl;
    private string $apiKey;

    /** @var array<string,mixed> */
    private array $options;

    /**
     * @param string               $apiUrl  Base URL of the Work Desk server (e.g. "https://workdesk.example.com")
     * @param string               $apiKey  API key generated from the Work Desk admin panel
     * @param array<string,mixed>  $options Optional settings:
     *                                        - timeout (int)         : cURL total timeout in seconds (default 30)
     *                                        - connect_timeout (int) : cURL connection timeout (default 10)
     *                                        - verify_ssl (bool)     : Verify SSL certificates (default true)
     *                                        - debug (bool)          : Print raw request/response info (default false)
     */
    public function __construct(string $apiUrl, string $apiKey, array $options = [])
    {
        if (empty(trim($apiUrl))) {
            throw new \InvalidArgumentException('$apiUrl must not be empty.');
        }
        if (empty(trim($apiKey))) {
            throw new \InvalidArgumentException('$apiKey must not be empty.');
        }

        $this->apiUrl  = rtrim($apiUrl, '/');
        $this->apiKey  = $apiKey;
        $this->options = array_merge([
            'timeout'         => self::TIMEOUT,
            'connect_timeout' => self::CONNECT_TIMEOUT,
            'verify_ssl'      => true,
            'debug'           => false,
        ], $options);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API Methods
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a new support ticket in Work Desk.
     *
     * Required fields:
     *   - 'subject' or 'title' (string, min 3 chars)
     *   - 'description'        (string, min 5 chars)
     *   - 'source_app'         (string, e.g. 'HRMS', 'Payroll', 'CRM')
     *
     * Optional fields:
     *   - 'priority'         (string: 'Low'|'Medium'|'High'|'Urgent', default 'Medium')
     *   - 'external_ref'     (string: your system's ticket/reference ID)
     *   - 'raised_by_email'  (string: employee email to link ticket to)
     *   - 'project_id'       (int: Work Desk project ID)
     *
     * @param  array<string,mixed>  $data          Ticket data (see above)
     * @param  string|null          $attachmentPath Absolute path to a file to attach (optional)
     * @return array<string,mixed>  Response data containing 'ticketId', 'status', 'source_app', 'external_ref'
     *
     * @throws ApiException     on API-level errors (4xx/5xx)
     * @throws NetworkException on cURL/network failures
     */
    public function createTicket(array $data, ?string $attachmentPath = null): array
    {
        $endpoint = self::BASE_PATH . '/tickets';

        if ($attachmentPath !== null) {
            // Multipart request with file
            if (!file_exists($attachmentPath) || !is_readable($attachmentPath)) {
                throw new \InvalidArgumentException("Attachment file not found or not readable: {$attachmentPath}");
            }
            $data['attachment'] = new \CURLFile(
                $attachmentPath,
                mime_content_type($attachmentPath) ?: 'application/octet-stream',
                basename($attachmentPath)
            );
            $response = $this->request('POST', $endpoint, $data, true);
        } else {
            $response = $this->request('POST', $endpoint, $data);
        }

        return $response['data'] ?? $response;
    }

    /**
     * Retrieve full details for a ticket by its Work Desk ticket ID.
     *
     * @param  int  $id  Work Desk ticket ID
     * @return Ticket
     *
     * @throws ApiException
     * @throws NetworkException
     */
    public function getTicket(int $id): Ticket
    {
        $response = $this->request('GET', self::BASE_PATH . "/tickets/{$id}");
        return new Ticket($response['data'] ?? $response);
    }

    /**
     * Lightweight status check — returns id, status, priority, and updated_at.
     *
     * @param  int  $id  Work Desk ticket ID
     * @return array<string,mixed>
     *
     * @throws ApiException
     * @throws NetworkException
     */
    public function getTicketStatus(int $id): array
    {
        $response = $this->request('GET', self::BASE_PATH . "/tickets/status/{$id}");
        return $response['data'] ?? $response;
    }

    /**
     * Upload or replace an attachment on an existing ticket.
     *
     * @param  int     $ticketId      Work Desk ticket ID
     * @param  string  $filePath      Absolute path to the file
     * @return array<string,mixed>
     *
     * @throws \InvalidArgumentException  if the file doesn't exist or is unreadable
     * @throws ApiException
     * @throws NetworkException
     */
    public function uploadAttachment(int $ticketId, string $filePath): array
    {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            throw new \InvalidArgumentException("File not found or not readable: {$filePath}");
        }

        $data = [
            'attachment' => new \CURLFile(
                $filePath,
                mime_content_type($filePath) ?: 'application/octet-stream',
                basename($filePath)
            ),
        ];

        $response = $this->request('POST', self::BASE_PATH . "/tickets/{$ticketId}/attachment", $data, true);
        return $response['data'] ?? $response;
    }

    /**
     * Post a comment or status update on a ticket.
     *
     * @param  int     $ticketId  Work Desk ticket ID
     * @param  string  $comment   The comment text
     * @return array<string,mixed>
     *
     * @throws ApiException
     * @throws NetworkException
     */
    public function addComment(int $ticketId, string $comment): array
    {
        $response = $this->request('POST', self::BASE_PATH . "/tickets/{$ticketId}/comments", [
            'comment' => $comment,
        ]);
        return $response['data'] ?? $response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP Transport (cURL)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Execute an HTTP request using cURL.
     *
     * @param  string               $method      HTTP method (GET, POST, PUT, DELETE)
     * @param  string               $path        API path (relative, e.g. "/api/integration/tickets")
     * @param  array<string,mixed>  $data        Request payload / query parameters
     * @param  bool                 $multipart   Whether to send as multipart/form-data
     * @return array<string,mixed>  Decoded JSON response body
     *
     * @throws NetworkException  on cURL failure
     * @throws ApiException      on non-2xx HTTP responses
     */
    private function request(string $method, string $path, array $data = [], bool $multipart = false): array
    {
        $url = $this->apiUrl . $path;

        $headers = [
            'X-API-KEY: ' . $this->apiKey,
            'Accept: application/json',
        ];

        if (!$multipart) {
            $headers[] = 'Content-Type: application/json';
        }

        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->options['timeout'],
            CURLOPT_CONNECTTIMEOUT => $this->options['connect_timeout'],
            CURLOPT_SSL_VERIFYPEER => $this->options['verify_ssl'],
            CURLOPT_SSL_VERIFYHOST => $this->options['verify_ssl'] ? 2 : 0,
            CURLOPT_HTTPHEADER     => $headers,
        ]);

        switch (strtoupper($method)) {
            case 'POST':
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_POST, true);
                if ($multipart) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
                } else {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
            default: // GET
                if (!empty($data)) {
                    $url .= '?' . http_build_query($data);
                }
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPGET, true);
                break;
        }

        if ($this->options['debug']) {
            curl_setopt($ch, CURLOPT_VERBOSE, true);
        }

        $rawBody   = curl_exec($ch);
        $curlError = curl_error($ch);
        $curlErrNo = curl_errno($ch);
        $httpCode  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlError || $rawBody === false) {
            throw new NetworkException(
                "cURL request failed: {$curlError}",
                $curlErrNo
            );
        }

        $body = json_decode((string) $rawBody, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ApiException(
                "Invalid JSON response from server: " . json_last_error_msg(),
                $httpCode,
                ['raw' => $rawBody]
            );
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $message = $body['message'] ?? "HTTP Error {$httpCode}";
            throw new ApiException($message, $httpCode, $body ?? []);
        }

        return $body;
    }
}
