<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderHistory extends Model
{
    use HasFactory;
<<<<<<< HEAD

=======
    
    // Bảng này trong DB của bạn không có cột updated_at
    public $timestamps = false; 
    
>>>>>>> cbd0a3bf9099cb1d16b1cfcb7fc0ead8091cd1ec
    protected $guarded = [];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
<<<<<<< HEAD

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}

=======
}
>>>>>>> cbd0a3bf9099cb1d16b1cfcb7fc0ead8091cd1ec
