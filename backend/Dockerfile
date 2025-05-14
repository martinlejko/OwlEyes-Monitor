FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpq-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    cron

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . /var/www/

# Set permissions
RUN chown -R www-data:www-data /var/www

# Configure Apache
COPY ./docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

# Setup cron job for monitor checks
COPY ./docker/cron/crontab /etc/cron.d/monitor-cron
RUN chmod 0644 /etc/cron.d/monitor-cron \
    && crontab /etc/cron.d/monitor-cron

# Start Apache and cron
CMD service cron start && apache2-foreground 