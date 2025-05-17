FROM php:8.2-apache

WORKDIR /var/www

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    libicu-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath intl

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy Apache configuration
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Enable rewrite module
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www

# Copy application files
COPY ./backend/. /var/www/

# Set permissions
RUN chown -R www-data:www-data /var/www
RUN mkdir -p /var/www/logs
RUN chmod -R 755 /var/www/logs

# Install dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Install dev dependencies for testing
RUN composer require --dev phpunit/phpunit:^9.5

# Create directory for tests
RUN mkdir -p /var/www/tests/Unit/Services /var/www/tests/Unit/Controllers /var/www/tests/Integration
RUN chown -R www-data:www-data /var/www/tests

# Command to run application
CMD ["apache2-foreground"] 