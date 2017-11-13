package io.github.olivierlemasle.planningOnpl

import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import java.time.LocalDate
import java.time.LocalTime
import java.time.Month
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.ChronoField
import java.util.*
import java.util.logging.Level
import java.util.logging.Logger

object Parser {
    init {
        Logger.getLogger("org.apache.pdfbox").level = Level.SEVERE
    }

    private val months = Month.values()
            .joinToString(separator = "|") {
                it.getDisplayName(TextStyle.FULL, Locale.FRANCE)
            }

    fun getLines(bytes: ByteArray): List<String> {
        val doc: PDDocument = PDDocument.load(bytes)
        val stripper = PDFTextStripper()
        stripper.sortByPosition = true
        return stripper.getText(doc).lines()
    }

    fun extractMonth(lines: Collection<String>): LocalDate? {
        val monthRegex = Regex("""($months)\s*(\d{4})""")
        val monthLine = lines.firstOrNull { it.contains(monthRegex) }
                ?: return null
        val (_, monthString, yearString) = monthRegex.find(monthLine)!!.groupValues
        val month = Month.values()
                .first {
                    monthString.equals(
                            other = it.getDisplayName(TextStyle.FULL, Locale.FRANCE),
                            ignoreCase = true
                    )
                }
        val year = yearString.toInt()
        return LocalDate.of(year, month, 1)
    }

    fun extractEvents(lines: Collection<String>, month: LocalDate): CalendarMonth? {
        val daysInMonth = month.range(ChronoField.DAY_OF_MONTH).maximum.toInt()

        val days = (1..daysInMonth)
                .map {
                    val day = month.withDayOfMonth(it)

                    // Example: '^\s*mercredi\s*5', matching 'Mercredi  5'
                    val formatted = day.format(DateTimeFormatter.ofPattern("'^\\s*'cccc'\\s*'d", Locale.FRANCE))
                    Day(date = day, formatted = formatted)
                }

        var i = 0
        var day: Day? = null
        var strippedLine: String
        for (line in lines) {
            if (i < daysInMonth && line.contains(Regex(pattern = days[i].formatted, option = RegexOption.IGNORE_CASE))) {
                day = days[i]
                strippedLine = Regex(pattern = days[i].formatted, option = RegexOption.IGNORE_CASE).replace(line, "").trim()
                i++
            } else {
                strippedLine = line.trim()
            }
            if (line.contains("Le présent planning")) {
                break
            }
            if (day != null) {
                val event = strippedLine.toEvent()
                if (event != null) {
                    day.events.add(event)
                }
            }
        }
        return CalendarMonth(
                month = month,
                days = days.map {
                    CalendarDay(
                            date = it.date,
                            events = it.events
                    )
                }
        )
    }

    private fun String.toEvent(): Event? {
        if (isEmpty())
            return null
        val delimitedEventRegex = Regex("""^(\d{2}h\d{2})-(\d{2}h\d{2})\s(.*)""")
        val unDelimitedEventRegex = Regex("""^(\d{2}h\d{2})\s(.*)""")
        return when {
            delimitedEventRegex.containsMatchIn(this) -> {
                val (_, start, end, remaining) = delimitedEventRegex.find(this)!!.groupValues
                Event(start = start.toTime(), end = end.toTime(), location = "", title = remaining.getSummary())
            }
            unDelimitedEventRegex.containsMatchIn(this) -> {
                val (_, startString, remaining) = unDelimitedEventRegex.find(this)!!.groupValues
                val start = startString.toTime()
                val end = start.plusHours(2)
                Event(start = start, end = end, location = "", title = remaining.getSummary())
            }
            else -> null
        }
    }

    private fun String.toTime(): LocalTime = LocalTime.parse(this, DateTimeFormatter.ofPattern("HH'h'mm"))

    private fun String.getSummary(): String {
        val matchResult = Regex("""((GF|FN|FA)(\d{1,2}))?\s*([0-9,]*)\s*(\d{2}[h:]\d{2})?$""").find(this)
        return if (matchResult != null) {
            val values = matchResult.groupValues
            this.replace(values[0], "")
        } else this
    }
}

private class Day(val date: LocalDate, val formatted: String, val events: MutableList<Event> = mutableListOf())
