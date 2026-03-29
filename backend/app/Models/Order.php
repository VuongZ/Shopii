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

<<<<<<< HEAD
    public function histories()
    {
        return $this->hasMany(OrderHistory::class);
=======
    public function userAddress()
    {
        return $this->belongsTo(UserAddress::class, 'user_address_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
>>>>>>> cbd0a3bf9099cb1d16b1cfcb7fc0ead8091cd1ec
    }
}