package com.aboryan.classpermit.data

import org.json.JSONArray
import org.json.JSONObject

data class Student(
    val id: Long = System.nanoTime(),
    val name: String,
    val permitCount: Int = 0,
    val lastPermit: String = ""
)

data class Teacher(
    val id: Long = System.nanoTime(),
    val name: String,
    val phone: String = ""
)

data class SchoolSettings(
    val schoolName: String = "",
    val issuerName: String = "",
    val principalName: String = "",
    val authority: String = "",
    val countryCode: String = "966"
)

data class Permit(
    val id: Long = System.nanoTime(),
    val serial: Int,
    val createdAt: Long = System.currentTimeMillis(),
    val gregorianDate: String,
    val hijriDate: String,
    val time: String,
    val calendarMode: String,
    val className: String,
    val period: String,
    val subject: String,
    val reason: String,
    val templateIndex: Int,
    val studentIds: List<Long>,
    val studentNames: List<String>,
    val teacherIds: List<Long>,
    val teacherNames: List<String>
)

data class AppState(
    val settings: SchoolSettings = SchoolSettings(),
    val students: List<Student> = emptyList(),
    val teachers: List<Teacher> = emptyList(),
    val permits: List<Permit> = emptyList(),
    val nextSerial: Int = 1,
    val selectedTemplate: Int = 0
) {
    fun toJson(): String = JSONObject().apply {
        put("settings", settings.toJson())
        put("students", JSONArray().apply { students.forEach { put(it.toJson()) } })
        put("teachers", JSONArray().apply { teachers.forEach { put(it.toJson()) } })
        put("permits", JSONArray().apply { permits.forEach { put(it.toJson()) } })
        put("nextSerial", nextSerial)
        put("selectedTemplate", selectedTemplate)
    }.toString()

    companion object {
        fun fromJson(text: String): AppState {
            if (text.isBlank()) return AppState()
            val root = JSONObject(text)
            val studentsJson = root.optJSONArray("students") ?: JSONArray()
            val teachersJson = root.optJSONArray("teachers") ?: JSONArray()
            val permitsJson = root.optJSONArray("permits") ?: JSONArray()
            return AppState(
                settings = schoolFromJson(root.optJSONObject("settings") ?: JSONObject()),
                students = List(studentsJson.length()) { studentFromJson(studentsJson.getJSONObject(it)) },
                teachers = List(teachersJson.length()) { teacherFromJson(teachersJson.getJSONObject(it)) },
                permits = List(permitsJson.length()) { permitFromJson(permitsJson.getJSONObject(it)) },
                nextSerial = root.optInt("nextSerial", 1).coerceAtLeast(1),
                selectedTemplate = root.optInt("selectedTemplate", 0).coerceIn(0, 4)
            )
        }
    }
}

private fun Student.toJson() = JSONObject().apply {
    put("id", id); put("name", name); put("permitCount", permitCount); put("lastPermit", lastPermit)
}
private fun Teacher.toJson() = JSONObject().apply {
    put("id", id); put("name", name); put("phone", phone)
}
private fun SchoolSettings.toJson() = JSONObject().apply {
    put("schoolName", schoolName); put("issuerName", issuerName); put("principalName", principalName)
    put("authority", authority); put("countryCode", countryCode)
}
private fun Permit.toJson() = JSONObject().apply {
    put("id", id); put("serial", serial); put("createdAt", createdAt)
    put("gregorianDate", gregorianDate); put("hijriDate", hijriDate); put("time", time)
    put("calendarMode", calendarMode); put("className", className); put("period", period)
    put("subject", subject); put("reason", reason); put("templateIndex", templateIndex)
    put("studentIds", JSONArray(studentIds)); put("studentNames", JSONArray(studentNames))
    put("teacherIds", JSONArray(teacherIds)); put("teacherNames", JSONArray(teacherNames))
}

private fun jsonLongs(array: JSONArray): List<Long> = List(array.length()) { array.optLong(it) }
private fun jsonStrings(array: JSONArray): List<String> = List(array.length()) { array.optString(it) }

private fun studentFromJson(o: JSONObject) = Student(
    id = o.optLong("id", System.nanoTime()), name = o.optString("name"),
    permitCount = o.optInt("permitCount", 0), lastPermit = o.optString("lastPermit")
)
private fun teacherFromJson(o: JSONObject) = Teacher(
    id = o.optLong("id", System.nanoTime()), name = o.optString("name"), phone = o.optString("phone")
)
private fun schoolFromJson(o: JSONObject) = SchoolSettings(
    schoolName = o.optString("schoolName"), issuerName = o.optString("issuerName"),
    principalName = o.optString("principalName"), authority = o.optString("authority"),
    countryCode = o.optString("countryCode", "966")
)
private fun permitFromJson(o: JSONObject) = Permit(
    id = o.optLong("id", System.nanoTime()), serial = o.optInt("serial", 1),
    createdAt = o.optLong("createdAt", System.currentTimeMillis()),
    gregorianDate = o.optString("gregorianDate"), hijriDate = o.optString("hijriDate"),
    time = o.optString("time"), calendarMode = o.optString("calendarMode", "both"),
    className = o.optString("className"), period = o.optString("period"),
    subject = o.optString("subject"), reason = o.optString("reason"),
    templateIndex = o.optInt("templateIndex", 0).coerceIn(0, 4),
    studentIds = jsonLongs(o.optJSONArray("studentIds") ?: JSONArray()),
    studentNames = jsonStrings(o.optJSONArray("studentNames") ?: JSONArray()),
    teacherIds = jsonLongs(o.optJSONArray("teacherIds") ?: JSONArray()),
    teacherNames = jsonStrings(o.optJSONArray("teacherNames") ?: JSONArray())
)
