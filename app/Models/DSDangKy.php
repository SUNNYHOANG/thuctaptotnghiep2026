<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DSDangKy extends Model
{
    use HasFactory;

    protected $table = 'dsdangky';
    protected $fillable = [
        'mamonhoc',
        'mssv',
        'dstenmonhoc',
        'dsgiangvien',
        'dssotinchi',
    ];
    // Liên kết với bảng SinhVien
    public function sinhvien()
    {
        return $this->belongsTo(SinhVien::class, 'mssv', 'mssv');
    }

    // Liên kết với bảng MonHoc
    public function monhoc()
    {
        return $this->belongsTo(MonHoc::class, 'mamonhoc', 'mamonhoc');
    }
}
