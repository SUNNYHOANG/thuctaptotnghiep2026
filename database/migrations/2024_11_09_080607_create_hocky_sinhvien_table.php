<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hocky_sinhvien', function (Blueprint $table) {
            $table->id();
            $table->string('mssv');
            $table->foreign('mssv')->references('mssv')->on('sinhvien');
            $table->string('mahocky');
            $table->foreign('mahocky')->references('mahocky')->on('hocky');
            $table->string('trangthai_hocky_sinhvien');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hocky_sinhvien');
    }
};
