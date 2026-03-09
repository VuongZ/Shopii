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

    return redirect('/');
});


/*
|--------------------------------------------------------------------------
| READ ALL USERS (API)
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

    return redirect('/');
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

    return redirect('/');
});


/*
|--------------------------------------------------------------------------
| HTML CRUD PAGE
|--------------------------------------------------------------------------
*/
Route::get('/', function () {

    $users = User::select('id','name','email')->orderBy('id','desc')->get();

    echo "
    <style>
    body{font-family:Arial;padding:30px;background:#f7f7f7}
    h1{margin-bottom:20px}
    table{border-collapse:collapse;width:700px;background:white}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f0f0f0}
    form{display:inline}
    input{padding:6px;margin-right:5px}
    button{padding:6px 10px;border:none;background:#3490dc;color:white;cursor:pointer}
    .delete{background:#e3342f}
    </style>

    <h1>User CRUD</h1>

    <h3>Create User</h3>

    <form method='POST' action='/users'>
        <input name='name' placeholder='Name' required>
        <input name='email' placeholder='Email' required>
        <button type='submit'>Create</button>
    </form>

    <br><br>

    <table>
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Actions</th>
    </tr>
    ";

    foreach($users as $user){

        echo "
        <tr>

        <td>{$user->id}</td>

        <td>
        <form method='POST' action='/users/{$user->id}?_method=PUT'>
            <input name='name' value='{$user->name}'>
        </td>

        <td>
            <input name='email' value='{$user->email}'>
        </td>

        <td>
            <button type='submit'>Update</button>
        </form>

        <form method='POST' action='/users/{$user->id}?_method=DELETE'>
            <button class='delete'>Delete</button>
        </form>
        </td>

        </tr>
        ";
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