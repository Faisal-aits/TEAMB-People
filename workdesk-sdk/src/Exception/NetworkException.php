<?php

declare(strict_types=1);

namespace WorkDesk\SDK\Exception;

/**
 * Thrown when a cURL/network-level error occurs (DNS failure, timeout, TLS error, etc).
 */
class NetworkException extends WorkDeskException
{
    /** @var int cURL error code */
    private int $curlErrorCode;

    public function __construct(string $message, int $curlErrorCode = 0, ?\Throwable $previous = null)
    {
        $this->curlErrorCode = $curlErrorCode;
        parent::__construct($message, $curlErrorCode, $previous);
    }

    public function getCurlErrorCode(): int
    {
        return $this->curlErrorCode;
    }
}
