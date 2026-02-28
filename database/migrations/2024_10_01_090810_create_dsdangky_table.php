<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDsdangkyTable extends Migration
{
    public function up()
    {
        Schema::create('dsdangky', function (Blueprint $table) {
            $table->id();
            $table->string('mamonhoc');
            $table->string('mssv');
            $table->string('dstenmonhoc');
            $table->string('dsgiangvien');
            $table->integer('dssotinchi');

            $table->foreign('mamonhoc')->references('mamonhoc')->on('monhoc');
            $table->foreign('mssv')->references('mssv')->on('sinhvien');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('dsdangky');
    }
}
