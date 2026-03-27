<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function userAddress()
    {
        return $this->belongsTo(UserAddress::class, 'user_address_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}