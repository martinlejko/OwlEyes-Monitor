<?php

namespace Martinlejko\Backend\Controllers;

use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class BadgeController
{
    private MonitorService $monitorService;
    private MonitorStatusService $statusService;
    private LoggerInterface $logger;
    
    public function __construct(
        MonitorService $monitorService,
        MonitorStatusService $statusService,
        LoggerInterface $logger
    ) {
        $this->monitorService = $monitorService;
        $this->statusService = $statusService;
        $this->logger = $logger;
    }
    
    public function getBadge(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        
        try {
            // Get monitor
            $monitor = $this->monitorService->find($id);
            
            if (!$monitor) {
                return $this->generateErrorBadge($response, 'Monitor not found');
            }
            
            // Get latest status
            $latestStatus = $this->statusService->getLatestStatus($id);
            
            $label = $monitor->getBadgeLabel();
            $value = $latestStatus && $latestStatus->getStatus() ? 'up' : 'down';
            $color = $latestStatus && $latestStatus->getStatus() ? 'green' : 'red';
            
            $this->logger->info("Generating badge for monitor ID: {$id}", [
                'label' => $label,
                'value' => $value,
                'color' => $color
            ]);
            
            // Generate badge
            $badge = $this->generateBadge($label, $value, $color);
            
            $response->getBody()->write($badge);
            return $response
                ->withHeader('Content-Type', 'image/svg+xml')
                ->withHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                ->withHeader('Pragma', 'no-cache')
                ->withHeader('Expires', '0');
        } catch (\Exception $e) {
            $this->logger->error('Error generating badge: ' . $e->getMessage());
            return $this->generateErrorBadge($response, 'Error');
        }
    }
    
    private function generateBadge(string $label, string $value, string $color): string
    {
        // Escape values for XML
        $label = htmlspecialchars($label, ENT_XML1, 'UTF-8');
        $value = htmlspecialchars($value, ENT_XML1, 'UTF-8');
        
        // Calculate widths
        $labelWidth = $this->calculateWidth($label);
        $valueWidth = $this->calculateWidth($value);
        $totalWidth = $labelWidth + $valueWidth;
        
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{$totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="{$totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h{$labelWidth}v20H0z"/>
    <path fill="{$color}" d="M{$labelWidth} 0h{$valueWidth}v20H{$labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h{$totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{$this->calculateTextPosition($labelWidth)}" y="15" fill="#010101" fill-opacity=".3">{$label}</text>
    <text x="{$this->calculateTextPosition($labelWidth)}" y="14">{$label}</text>
    <text x="{$this->calculateTextPosition($valueWidth, $labelWidth)}" y="15" fill="#010101" fill-opacity=".3">{$value}</text>
    <text x="{$this->calculateTextPosition($valueWidth, $labelWidth)}" y="14">{$value}</text>
  </g>
</svg>
SVG;
    }
    
    private function generateErrorBadge(Response $response, string $errorMessage): Response
    {
        $badge = $this->generateBadge('error', $errorMessage, 'red');
        $response->getBody()->write($badge);
        return $response
            ->withHeader('Content-Type', 'image/svg+xml')
            ->withHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->withHeader('Pragma', 'no-cache')
            ->withHeader('Expires', '0');
    }
    
    private function calculateWidth(string $text): int
    {
        // Estimate the width based on character count (6px per char + 10px padding on each side)
        return strlen($text) * 6 + 20;
    }
    
    private function calculateTextPosition(int $width, int $offset = 0): int
    {
        // Center the text in its section
        return $offset + ($width / 2);
    }
} 