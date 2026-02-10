# Sử dụng PHP 8.2
FROM php:8.2-apache

# Cài đặt các thư viện cần thiết
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql zip

# Bật tính năng rewrite của Apache (để chạy Laravel)
RUN a2enmod rewrite

# Thiết lập thư mục làm việc
WORKDIR /var/www/html

# Copy toàn bộ code từ máy bạn vào server
COPY . .

# Cài đặt Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Phân quyền
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Cấu hình cổng
ENV PORT=8080
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf

# --- QUAN TRỌNG: SỬA DÒNG CUỐI CÙNG ---
# Xóa cache config cũ để nhận cấu hình CORS mới
CMD php artisan optimize:clear && apache2-foreground