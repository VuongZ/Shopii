<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;
    protected $guarded = [];

    // Quan hệ với bảng product_skus
    public function sku()
    {
        return $this->belongsTo(ProductSku::class, 'product_sku_id');
    }
}