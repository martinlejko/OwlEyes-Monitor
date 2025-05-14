<?php

namespace Martinlejko\Backend\Models;

class Monitor
{
    private int $id;
    private int $projectId;
    private string $label;
    private int $periodicity;
    private string $type;
    private string $badgeLabel;
    
    // Type-specific fields
    private ?string $host = null;
    private ?int $port = null;
    private ?string $url = null;
    private bool $checkStatus = false;
    private array $keywords = [];
    
    public function __construct(
        int $projectId, 
        string $label, 
        int $periodicity, 
        string $type, 
        string $badgeLabel
    ) {
        $this->projectId = $projectId;
        $this->label = $label;
        $this->setPeriodicity($periodicity); // Uses validation
        $this->type = $type;
        $this->badgeLabel = $badgeLabel;
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
    
    public function getProjectId(): int
    {
        return $this->projectId;
    }
    
    public function setProjectId(int $projectId): self
    {
        $this->projectId = $projectId;
        return $this;
    }
    
    public function getLabel(): string
    {
        return $this->label;
    }
    
    public function setLabel(string $label): self
    {
        $this->label = $label;
        return $this;
    }
    
    public function getPeriodicity(): int
    {
        return $this->periodicity;
    }
    
    public function setPeriodicity(int $periodicity): self
    {
        // Validate periodicity range
        if ($periodicity < 5 || $periodicity > 300) {
            throw new \InvalidArgumentException('Periodicity must be between 5 and 300 seconds');
        }
        
        $this->periodicity = $periodicity;
        return $this;
    }
    
    public function getType(): string
    {
        return $this->type;
    }
    
    public function setType(string $type): self
    {
        if (!in_array($type, ['ping', 'website'])) {
            throw new \InvalidArgumentException('Monitor type must be either "ping" or "website"');
        }
        
        $this->type = $type;
        return $this;
    }
    
    public function getBadgeLabel(): string
    {
        return $this->badgeLabel;
    }
    
    public function setBadgeLabel(string $badgeLabel): self
    {
        $this->badgeLabel = $badgeLabel;
        return $this;
    }
    
    // Ping monitor properties
    public function getHost(): ?string
    {
        return $this->host;
    }
    
    public function setHost(?string $host): self
    {
        $this->host = $host;
        return $this;
    }
    
    public function getPort(): ?int
    {
        return $this->port;
    }
    
    public function setPort(?int $port): self
    {
        $this->port = $port;
        return $this;
    }
    
    // Website monitor properties
    public function getUrl(): ?string
    {
        return $this->url;
    }
    
    public function setUrl(?string $url): self
    {
        $this->url = $url;
        return $this;
    }
    
    public function isCheckStatus(): bool
    {
        return $this->checkStatus;
    }
    
    public function setCheckStatus(bool $checkStatus): self
    {
        $this->checkStatus = $checkStatus;
        return $this;
    }
    
    public function getKeywords(): array
    {
        return $this->keywords;
    }
    
    public function setKeywords(array $keywords): self
    {
        $this->keywords = $keywords;
        return $this;
    }
    
    public function toArray(): array
    {
        $data = [
            'id' => $this->id ?? null,
            'projectId' => $this->projectId,
            'label' => $this->label,
            'periodicity' => $this->periodicity,
            'type' => $this->type,
            'badgeLabel' => $this->badgeLabel
        ];
        
        // Add type-specific fields
        if ($this->type === 'ping') {
            $data['host'] = $this->host;
            $data['port'] = $this->port;
        } elseif ($this->type === 'website') {
            $data['url'] = $this->url;
            $data['checkStatus'] = $this->checkStatus;
            $data['keywords'] = $this->keywords;
        }
        
        return $data;
    }
    
    public static function fromArray(array $data): self
    {
        $monitor = new self(
            $data['projectId'],
            $data['label'],
            $data['periodicity'],
            $data['type'],
            $data['badgeLabel']
        );
        
        if (isset($data['id'])) {
            $monitor->setId($data['id']);
        }
        
        // Set type-specific fields
        if ($data['type'] === 'ping') {
            $monitor->setHost($data['host'] ?? null);
            $monitor->setPort($data['port'] ?? null);
        } elseif ($data['type'] === 'website') {
            $monitor->setUrl($data['url'] ?? null);
            $monitor->setCheckStatus($data['checkStatus'] ?? false);
            $monitor->setKeywords($data['keywords'] ?? []);
        }
        
        return $monitor;
    }
} 