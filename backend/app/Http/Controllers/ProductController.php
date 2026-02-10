<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product; // 

class ProductController extends Controller
{
    // Lấy danh sách tất cả sản phẩm
    public function index()
    {
        return Product::all();
    }

    // Lấy chi tiết 1 sản phẩm
    public function show($id)
    {
        return Product::find($id);
    }
}