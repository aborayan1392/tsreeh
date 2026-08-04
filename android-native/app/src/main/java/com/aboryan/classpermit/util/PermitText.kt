package com.aboryan.classpermit.util

import com.aboryan.classpermit.data.Permit

object PermitText {
    val reasons = listOf(
        "الإذاعة المدرسية", "نشاط لا صفي", "مقابلة الإرشاد الطلابي", "تكليف إداري",
        "معالجة درس سابق", "اختبار تعويضي", "مسابقة مدرسية", "العيادة والإسعافات",
        "تنظيم فعالية", "اجتماع لجنة طلابية"
    )

    val templateNames = listOf("رسمي راقٍ", "ودّي قريب", "تربوي مباشر", "بلاغي مميّز", "موجز سريع")

    private val templates = listOf(
        """زميلي المعلم الفاضل / [[TO]]   حفظه الله
السلام عليكم ورحمة الله وبركاته،
أستأذن كريمَ خلقكم في السماح للطلاب المدوَّنة أسماؤهم أدناه بدخول حصتكم؛ فقد كانوا لديّ في [[REASON]]، وقد حرصوا على العودة إليكم فور انتهائهم. فلكم مني جزيل الشكر على رحابة صدركم، ودمتم عونًا لأبنائنا.""",
        """معلمنا الغالي / [[TO]]
لم يتأخر هؤلاء عن حصتك رغبةً عنها، بل كانوا لديّ في [[REASON]]. فافتح لهم بابك كعادتك، واحسب هذا التأخير لهم لا عليهم، وأبقِ لهم مقاعدهم بين يديك. شكرًا لك.""",
        """الأستاذ الفاضل / [[TO]]
نأمل التكرّم بالسماح للطلاب الموضحة أسماؤهم بدخول الحصة، وقد كانوا مشاركين معنا في [[REASON]]. تأخّرهم بعذر مقبول، ونثق بتعويضكم لهم ما فاتهم. جزاكم الله خيرًا.""",
        """إلى من يزيّن صفَّه بعلمه، الأستاذ / [[TO]]
هؤلاء أبناؤك عادوا إليك يحملون اعتذارًا صادقًا؛ فقد استأثرنا بوقتهم في [[REASON]]، وما تأخُّرهم إلا لعذر، وما شوقهم إلا إلى مقعدهم بين يديك. فأذن لهم مأجورًا مشكورًا.""",
        """الأستاذ / [[TO]]
يرجى السماح للطلاب أدناه بدخول الحصة، وقد كانوا لديّ في [[REASON]]. شاكرًا تعاونكم."""
    )

    fun body(permit: Permit, teacherName: String): String = templates[permit.templateIndex]
        .replace("[[TO]]", teacherName)
        .replace("[[REASON]]", permit.reason)

    fun dateLabel(permit: Permit): String = when (permit.calendarMode) {
        "g" -> permit.gregorianDate
        "h" -> permit.hijriDate
        else -> "${permit.hijriDate}  |  ${permit.gregorianDate}"
    }

    fun fullMessage(permit: Permit, teacherName: String): String = buildString {
        append(body(permit, teacherName)).append("\n\n")
        append("الطلاب:\n")
        permit.studentNames.forEachIndexed { index, name -> append("${index + 1}. $name\n") }
        append("\nالصف: ${permit.className}")
        if (permit.period.isNotBlank()) append(" | الحصة: ${permit.period}")
        if (permit.subject.isNotBlank()) append(" | المادة: ${permit.subject}")
        append("\nالتاريخ: ${dateLabel(permit)} | الوقت: ${permit.time}")
        append("\nرقم التصريح: ${permit.serial}")
    }
}
