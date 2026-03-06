<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

Route::get('/', function () {

    try {

        // Cache danh sách user trong 60 giây
        $users = Cache::remember('users_page_' . request('page', 1), 60, function () {
            return User::select('id','name','email')
                ->orderBy('id','desc')
                ->paginate(20);
        });

        echo "
        <style>
        body{font-family:Arial;padding:20px}
        table{border-collapse:collapse;width:600px}
        th,td{padding:8px;border:1px solid #ccc;text-align:left}
        th{background:#f2f2f2}
        h1{margin-bottom:20px}
        .pagination a{margin:4px;padding:6px 10px;border:1px solid #ccc;text-decoration:none}
        </style>
        ";

        echo "<h1>User List</h1>";

        echo "<table>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th></tr>";

        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user->id}</td>";
            echo "<td>{$user->name}</td>";
            echo "<td>{$user->email}</td>";
            echo "</tr>";
        }

        echo "</table>";

        echo "<div class='pagination'>";
        echo $users->links();
        echo "</div>";

    } catch (\Exception $e) {

        echo "<h2>Database Error</h2>";
        echo "<pre>".$e->getMessage()."</pre>";

    }

});

Route::get('/clear-cache-secret-123', function () {

    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    Artisan::call('config:cache');

    return "Cache cleared successfully!";

});