<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonHoc extends Model
{
    use HasFactory;

    protected $table = 'monhoc';
    protected $primaryKey = 'mamonhoc';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'mamonhoc',
        'tenmonhoc',
        'giangvien',
        'sotinchi',
        'soluongsinhvien',
        'dadangky',
        'makhoa',
    ];

    // Liên kết với bảng Khoa
    public function khoa()
    {
        return $this->belongsTo(Khoa::class, 'makhoa', 'makhoa');
    }

    // Liên kết với bảng DSDangKy
    public function dsdangky()
    {
        return $this->hasMany(DSDangKy::class, 'mamonhoc', 'mamonhoc');
    }

    // Liên kết nhiều-nhiều với bảng SinhVien qua bảng DSDangKy
    public function sinhviens()
    {
        return $this->belongsToMany(SinhVien::class, 'dsdangky', 'mamonhoc', 'mssv');
    }
    public function hocky()
    {
        return $this->belongsTo(HocKy::class, 'makhoa', 'makhoa');
    }
}
