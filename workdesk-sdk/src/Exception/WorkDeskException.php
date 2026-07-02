<?php

declare(strict_types=1);

namespace WorkDesk\SDK\Exception;

/**
 * Base exception for all Work Desk SDK errors.
 */
class WorkDeskException extends \RuntimeException
{
    public function __construct(string $message = '', int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
