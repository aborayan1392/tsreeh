package com.aboryan.classpermit.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.aboryan.classpermit.R

val PermitGreen = Color(0xFF0E5A4E)
val PermitGreenDark = Color(0xFF08382F)
val PermitGold = Color(0xFFD9A93F)
val PermitRed = Color(0xFFB23A34)
val PermitSurface = Color(0xFFF4F7F5)

val Cairo = FontFamily(
    Font(R.font.cairo_regular, FontWeight.Normal),
    Font(R.font.cairo_semibold, FontWeight.SemiBold),
    Font(R.font.cairo_bold, FontWeight.Bold)
)

private val colors = lightColorScheme(
    primary = PermitGreen,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD9EFE8),
    onPrimaryContainer = PermitGreenDark,
    secondary = PermitGold,
    onSecondary = Color(0xFF332600),
    error = PermitRed,
    background = PermitSurface,
    surface = Color.White,
    onSurface = Color(0xFF16221F),
    outline = Color(0xFFB7C6C0)
)

@Composable
fun PermitTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = colors,
        typography = MaterialTheme.typography.copy(
            displayLarge = MaterialTheme.typography.displayLarge.copy(fontFamily = Cairo),
            headlineLarge = MaterialTheme.typography.headlineLarge.copy(fontFamily = Cairo, fontWeight = FontWeight.Bold),
            headlineMedium = MaterialTheme.typography.headlineMedium.copy(fontFamily = Cairo, fontWeight = FontWeight.Bold),
            titleLarge = MaterialTheme.typography.titleLarge.copy(fontFamily = Cairo, fontWeight = FontWeight.Bold),
            titleMedium = MaterialTheme.typography.titleMedium.copy(fontFamily = Cairo, fontWeight = FontWeight.SemiBold),
            bodyLarge = MaterialTheme.typography.bodyLarge.copy(fontFamily = Cairo),
            bodyMedium = MaterialTheme.typography.bodyMedium.copy(fontFamily = Cairo),
            labelLarge = MaterialTheme.typography.labelLarge.copy(fontFamily = Cairo, fontWeight = FontWeight.SemiBold),
            labelMedium = MaterialTheme.typography.labelMedium.copy(fontFamily = Cairo)
        ),
        content = content
    )
}
