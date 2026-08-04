package com.aboryan.classpermit.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class AppRepository(context: Context) : SQLiteOpenHelper(context, "class_entry_permit.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE app_state (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL)")
        val initial = AppState().toJson()
        db.execSQL("INSERT INTO app_state(id,json) VALUES(1,?)", arrayOf(initial))
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    @Synchronized
    fun load(): AppState = try {
        readableDatabase.rawQuery("SELECT json FROM app_state WHERE id=1", null).use { cursor ->
            if (cursor.moveToFirst()) AppState.fromJson(cursor.getString(0)) else AppState()
        }
    } catch (_: Exception) {
        AppState()
    }

    @Synchronized
    fun save(state: AppState) {
        writableDatabase.execSQL(
            "INSERT OR REPLACE INTO app_state(id,json) VALUES(1,?)",
            arrayOf(state.toJson())
        )
    }

    @Synchronized
    fun wipe() = save(AppState())
}
