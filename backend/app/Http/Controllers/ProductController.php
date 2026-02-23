<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product; // 

class ProductController extends Controller
{
    // Lấy danh sách sản phẩm
    public function index()
    {
        return Product::with([
            'shop',
            'category',
            'product_images',
            'skus'
        ])->get();
    }

    // Lấy chi tiết 1 sản phẩm
    public function show($id)
    {
        $product = Product::with([
            'shop',
            'category',
            'product_images',
            'skus'
        ])->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        }

        return $product;
    }
}