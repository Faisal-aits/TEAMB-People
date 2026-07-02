<?php

declare(strict_types=1);

namespace WorkDesk\SDK\Exception;

/**
 * Thrown when the Work Desk API returns a non-2xx HTTP response.
 */
class ApiException extends WorkDeskException
{
    /** @var int HTTP status code */
    private int $statusCode;

    /** @var array<string,mixed> Parsed API response body */
    private array $responseBody;

    /**
     * @param string               $message      Human-readable error description
     * @param int                  $statusCode   HTTP status code
     * @param array<string,mixed>  $responseBody Full decoded API response
     * @param \Throwable|null      $previous     Chained exception
     */
    public function __construct(
        string $message,
        int $statusCode,
        array $responseBody = [],
        ?\Throwable $previous = null
    ) {
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
        parent::__construct($message, $statusCode, $previous);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /** @return array<string,mixed> */
    public function getResponseBody(): array
    {
        return $this->responseBody;
    }

    public function getApiMessage(): string
    {
        return $this->responseBody['message'] ?? $this->getMessage();
    }
}
