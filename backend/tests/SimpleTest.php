<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

class SimpleTest extends TestCase
{
    public function testThatTestingWorks()
    {
        $this->assertTrue(true);
        $this->assertEquals(2, 1+1);
        $this->assertNotEquals(5, 2+2);
    }
} 