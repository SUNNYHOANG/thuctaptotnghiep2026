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
        Schema::create('hocky', function (Blueprint $table) {
            $table->string('mahocky')->primary();
            $table->string('tenhocky');
            $table->date('ngaybatdau');
            $table->date('ngayketthuc');
            $table->string('namhoc');
            $table->boolean('trangthai')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hocky');
    }
};
