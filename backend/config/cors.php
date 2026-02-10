<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // Cho phép các đường dẫn nào được gọi (api/* là quan trọng nhất)
    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],

    // Cho phép phương thức nào (GET, POST, PUT, DELETE...)
    'allowed_methods' => ['*'],

    // QUAN TRỌNG: Cho phép Frontend nào được gọi vào?
    // Cách 1 (An toàn): Chỉ cho phép Vercel và Localhost
    // 'allowed_origins' => ['https://shopii-seven.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:8000'],
    
    // Cách 2 (Dễ tính nhất để chạy được ngay): Cho phép TẤT CẢ
    'allowed_origins' => ['*'], 

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Đặt là true để cho phép gửi Cookie/Token đăng nhập
    'supports_credentials' => true, 

];