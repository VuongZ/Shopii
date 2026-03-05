<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {

    $users = User::all();

    echo "<h1>User List</h1>";
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th></tr>";

    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user->id}</td>";
        echo "<td>{$user->name}</td>";
        echo "<td>{$user->email}</td>";
        echo "</tr>";
    }

    echo "</table>";

});
Route::get('/clear-cache', function() {
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    Artisan::call('config:cache');
    return "Đã xóa cache thành công! Cấu hình mới đã được cập nhật.";
});