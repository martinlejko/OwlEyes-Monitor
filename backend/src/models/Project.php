<?php

namespace Martinlejko\Backend\Models;

class Project
{
    private int $id;
    private string $label;
    private string $description;
    private array $tags;
    
    public function __construct(string $label, string $description, array $tags = [])
    {
        $this->label = $label;
        $this->description = $description;
        $this->tags = $tags;
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
    
    public function getLabel(): string
    {
        return $this->label;
    }
    
    public function setLabel(string $label): self
    {
        $this->label = $label;
        return $this;
    }
    
    public function getDescription(): string
    {
        return $this->description;
    }
    
    public function setDescription(string $description): self
    {
        $this->description = $description;
        return $this;
    }
    
    public function getTags(): array
    {
        return $this->tags;
    }
    
    public function setTags(array $tags): self
    {
        $this->tags = $tags;
        return $this;
    }
    
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'description' => $this->description,
            'tags' => $this->tags
        ];
    }
    
    public static function fromArray(array $data): self
    {
        $project = new self($data['label'], $data['description'], $data['tags'] ?? []);
        if (isset($data['id'])) {
            $project->setId($data['id']);
        }
        return $project;
    }
} 