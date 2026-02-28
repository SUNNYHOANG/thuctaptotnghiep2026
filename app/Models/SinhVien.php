<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class SinhVien extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'sinhvien';
    protected $primaryKey = 'mssv';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'mssv',
        'password',
        'mssv',
        'ngaysinh',
        'gioitinh',
        'malop',
        'makhoa',
        'quequan',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function dsdangky()
    {
        return $this->hasMany(DSDangKy::class, 'mssv', 'mssv');
    }

    // public function monhocs()
    // {
    //     return $this->belongsToMany(MonHoc::class, 'dsdangky', 'mssv', 'mamonhoc');
    // }

    public function lop()
    {
        return $this->belongsTo(LopHoc::class, 'malop', 'malop');
    }

    public function khoa()
    {
        return $this->belongsTo(Khoa::class, 'makhoa', 'makhoa');
    }
    public function hocky_sinhvien()
    {
        return $this->hasMany(HocKy_SinhVien::class, 'mssv', 'mssv');
    }

    // Add this method to get the name of the unique identifier for the user
    public function getAuthIdentifierName()
    {
        return 'mssv';
    }

    // Add this method to get the unique identifier for the user
    public function getAuthIdentifier()
    {
        return $this->getAttribute($this->getAuthIdentifierName());
    }

    // Add this method to get the password for the user
    public function getAuthPassword()
    {
        return $this->password;
    }
}
