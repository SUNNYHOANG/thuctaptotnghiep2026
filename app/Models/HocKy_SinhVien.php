<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HocKy_SinhVien extends Model
{
    use HasFactory;

    protected $table = 'hocky_sinhvien';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $fillable = [
        'mssv',
        'mahocky',
        'trangthai_hocky_sinhvien',
    ];
    
    public function sinhvien()
    {
        return $this->belongsTo(SinhVien::class, 'mssv', 'mssv');
    }

    public function hocky()
    {
        return $this->belongsTo(HocKy::class, 'mahocky', 'mahocky');
    }
}
