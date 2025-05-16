<?php

namespace Martinlejko\Backend\Models;

class MonitorStatus
{
    private int $id;
    private int $monitorId;
    private \DateTime $startTime;
    private bool $status;
    private int $responseTime;

    public function __construct(int $monitorId, \DateTime $startTime, bool $status, int $responseTime)
    {
        $this->monitorId    = $monitorId;
        $this->startTime    = $startTime;
        $this->status       = $status;
        $this->responseTime = $responseTime;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): self
    {
        $this->id = $id;

        return $this;
    }

    public function getMonitorId(): int
    {
        return $this->monitorId;
    }

    public function setMonitorId(int $monitorId): self
    {
        $this->monitorId = $monitorId;

        return $this;
    }

    public function getStartTime(): \DateTime
    {
        return $this->startTime;
    }

    public function setStartTime(\DateTime $startTime): self
    {
        $this->startTime = $startTime;

        return $this;
    }

    public function getStatus(): bool
    {
        return $this->status;
    }

    public function setStatus(bool $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function getResponseTime(): int
    {
        return $this->responseTime;
    }

    public function setResponseTime(int $responseTime): self
    {
        $this->responseTime = $responseTime;

        return $this;
    }

    public function toArray(): array
    {
        return [
            'id'           => $this->id ?? null,
            'monitorId'    => $this->monitorId,
            'startTime'    => $this->startTime->format(\DateTime::ATOM),
            'status'       => $this->status,
            'responseTime' => $this->responseTime
        ];
    }

    public static function fromArray(array $data): self
    {
        $startTime = $data['startTime'] instanceof \DateTime
            ? $data['startTime']
            : new \DateTime($data['startTime']);

        $status = new self(
            $data['monitorId'],
            $startTime,
            $data['status'],
            $data['responseTime']
        );

        if (isset($data['id'])) {
            $status->setId($data['id']);
        }

        return $status;
    }
}
