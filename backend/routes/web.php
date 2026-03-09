<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
Route::post('/users', function (Request $request) {

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => bcrypt('123456')
    ]);

    return response()->json($user);

});

/*
|--------------------------------------------------------------------------
| READ ALL USERS
|--------------------------------------------------------------------------
*/
Route::get('/users', function () {

    $users = Cache::remember('users_list', 60, function () {
        return User::select('id','name','email')->get();
    });

    return response()->json($users);

});

/*
|--------------------------------------------------------------------------
| READ USER BY ID
|--------------------------------------------------------------------------
*/
Route::get('/users/{id}', function ($id) {

    $user = User::select('id','name','email')->find($id);

    if(!$user){
        return response()->json(["message"=>"User not found"],404);
    }

    return response()->json($user);

});

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
Route::put('/users/{id}', function (Request $request,$id) {

    $user = User::find($id);

    if(!$user){
        return response()->json(["message"=>"User not found"],404);
    }

    $user->update([
        'name'=>$request->name,
        'email'=>$request->email
    ]);

    return response()->json($user);

});

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
Route::delete('/users/{id}', function ($id) {

    $user = User::find($id);

    if(!$user){
        return response()->json(["message"=>"User not found"],404);
    }

    $user->delete();

    return response()->json(["message"=>"User deleted"]);

});

/*
|--------------------------------------------------------------------------
| HTML PAGE USER TABLE
|--------------------------------------------------------------------------
*/
Route::get('/', function () {

    $users = User::select('id','name','email')->paginate(20);

    echo "<h1>User List</h1>";
    echo "<table border='1' cellpadding='8'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th></tr>";

    foreach($users as $user){
        echo "<tr>";
        echo "<td>$user->id</td>";
        echo "<td>$user->name</td>";
        echo "<td>$user->email</td>";
        echo "</tr>";
    }

    echo "</table>";

});

/*
|--------------------------------------------------------------------------
| CLEAR CACHE
|--------------------------------------------------------------------------
*/
Route::get('/clear-cache-secret-123', function () {

    Artisan::call('config:clear');
    Artisan::call('cache:clear');

    return "Cache cleared";

});