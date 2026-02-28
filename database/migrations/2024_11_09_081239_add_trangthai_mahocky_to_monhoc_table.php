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
        Schema::table('monhoc', function (Blueprint $table) {
            $table->boolean('trangthai')->default(true);
            $table->string('mahocky');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monhoc', function (Blueprint $table) {
            $table->dropColumn('trangthai'); // Xóa cột 'description'
            $table->dropColumn('mahocky'); // Xóa cột 'description'
        });
    }
};
