<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
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
    // Thêm sản phẩm mới (Dành cho Seller)
  public function store(Request $request)
    {
        try {
            $shop = \App\Models\Shop::where('user_id', $request->user()->id)->first(); 
            if (!$shop) {
                return response()->json(['message' => 'Bạn chưa có Cửa hàng để đăng sản phẩm!'], 403);
            }

            // 1. Tạo sản phẩm
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'slug' => \Illuminate\Support\Str::slug($request->name) . '-' . uniqid(), 
                'description' => $request->description,
                'base_price' => $request->base_price,
            ]);

            // 2. Lưu LINK ẢNH
            if ($request->image_url) {
                $product->product_images()->create([
                    'image_url' => $request->image_url,
                    'is_thumbnail' => 1
                ]);
            }

            // 3. XỬ LÝ SKU "BẤT TỬ"
            $skusData = $request->input('skus'); // Lấy mảng skus gửi từ React
            
            if (!empty($skusData) && is_array($skusData)) {
                foreach ($skusData as $skuData) {
                    $product->skus()->create([
                        'sku' => $skuData['sku_code'], // Sẽ lưu chữ "Đen", "Trắng"
                        'price' => $skuData['price'],
                        'stock' => $skuData['stock'] ?? 0,
                    ]);
                }
            } else {
                $product->skus()->create([
                    'sku' => 'SKU-' . strtoupper(uniqid()),
                    'price' => $request->base_price,
                    'stock' => $request->stock ?? 0,
                ]);
            }

            $product->load(['product_images', 'skus']);

            return response()->json([
                'message' => 'Đăng sản phẩm thành công!',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi thêm sản phẩm!',
                'error' => $e->getMessage() 
            ], 500);
        }
    }
   // =========================================================
    // 1. HÀM CẬP NHẬT SẢN PHẨM (Sửa)
    // =========================================================
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        // Tìm shop trực tiếp trong DB (Khắc phục lỗi 403)
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 403);
        }

        // Tìm sản phẩm
        $product = \App\Models\Product::where('shop_id', $shop->id)->find($id);

        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // 1. CẬP NHẬT THÔNG TIN CƠ BẢN (Đã bỏ cột 'stock' cho đúng DB của bạn)
        $product->update([
            'name' => $request->name,
            'category_id' => $request->category_id,
            'base_price' => $request->base_price,
            'description' => $request->description,
        ]);

        // 2. CẬP NHẬT HÌNH ẢNH (Dùng 'is_thumbnail' chuẩn theo DB)
        if ($request->image_url) {
            $product->product_images()->delete(); // Xóa ảnh cũ
            $product->product_images()->create([
                'image_url' => $request->image_url,
                'is_thumbnail' => 1
            ]);
        }

        // 3. CẬP NHẬT PHÂN LOẠI VÀ TỒN KHO (Vào bảng product_skus)
        if ($request->has('skus') && count($request->skus) > 0) {
            $product->skus()->delete(); // Xóa phân loại cũ
            foreach ($request->skus as $skuData) {
                $product->skus()->create([
                    'sku' => $skuData['sku_code'],
                    'price' => $skuData['price'],
                    'stock' => $skuData['stock'],
                ]);
            }
        } else {
            // Nếu không có phân loại, gán số lượng tồn kho chung vào SKU "Mặc định"
            $product->skus()->delete();
            $product->skus()->create([
                'sku' => 'Mặc định',
                'price' => $request->base_price,
                'stock' => $request->stock ?? 0,
            ]);
        }

        return response()->json(['message' => 'Cập nhật sản phẩm thành công!', 'product' => $product]);
    }

    // =========================================================
    // 2. HÀM XÓA SẢN PHẨM (Xóa sạch sẽ không để lại rác DB)
    // =========================================================
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        // Tìm shop trực tiếp trong DB
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 403);
        }

        // Tìm sản phẩm cần xóa
        $product = \App\Models\Product::where('shop_id', $shop->id)->find($id);

        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // Dọn rác: Xóa các dữ liệu liên quan trước khi xóa sản phẩm chính
        $product->product_images()->delete();
        $product->skus()->delete();
        
        // Xóa sản phẩm chính
        $product->delete();

        return response()->json(['message' => 'Xóa sản phẩm thành công!']);
    }
}