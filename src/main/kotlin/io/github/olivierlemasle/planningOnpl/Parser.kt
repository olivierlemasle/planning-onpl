package io.github.olivierlemasle.planningOnpl

import com.google.common.annotations.VisibleForTesting
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.apache.pdfbox.text.PDFTextStripperByArea
import org.apache.pdfbox.text.TextPosition
import java.awt.geom.Rectangle2D
import java.time.LocalDate
import java.time.LocalTime
import java.time.Month
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.ChronoField
import java.util.*
import java.util.logging.Level
import java.util.logging.Logger


class Parser(bytes: ByteArray) {
    private val document: PDDocument = PDDocument.load(bytes)

    companion object {
        init {
            Logger.getLogger("org.apache.pdfbox").level = Level.SEVERE
        }

        // Janvier|Février|...
        private val months = Month.values()
                .joinToString(separator = "|") {
                    it.getDisplayName(TextStyle.FULL, Locale.FRANCE)
                }
    }


    @VisibleForTesting
    fun getLines(): List<String> {
        val stripper = PDFTextStripper()
        stripper.sortByPosition = true
        return stripper.getText(document).lines()
    }

    private fun getLocationWords(): Set<String> {
        val locationRegion = FindRegionTextStripper(leftWord = "Lieu", rightWord = "Nature").getRegion(document)

        val regionName = "location"
        val stripper = PDFTextStripperByArea()
        stripper.sortByPosition = true
        stripper.addRegion(regionName, locationRegion)
        stripper.extractRegions(document.getPage(0))

        // Get text in delimited region
        val lines = stripper.getTextForRegion(regionName).lines()

        // Remove lines before the header, the header itself and blank lines
        return lines.subList(fromIndex = lines.indexOfFirst { it.contains("Lieu") } + 1, toIndex = lines.size)
                .filterNot { it.isBlank() }
                .toSet()
    }

    @VisibleForTesting
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

    fun extractEvents(): CalendarMonth? {
        val locationWords = getLocationWords()

        val lines = getLines()
        val month = extractMonth(lines)
                ?: return null
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
                val event = createEvent(strippedLine, locationWords)
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

    private fun createEvent(line: String, locationWords: Set<String>): Event? {
        if (line.isEmpty())
            return null
        val delimitedEventRegex = Regex("""^(\d{1,2}h\d{2})-(\d{2}h\d{2})\s(.*)""")
        val unDelimitedEventRegex = Regex("""^(\d{1,2}h\d{2})\s(.*)""")
        return when {
            delimitedEventRegex.containsMatchIn(line) -> {
                val (_, startString, endString, remaining) = delimitedEventRegex.find(line)!!.groupValues
                val start = startString.toTime()
                val end = endString.toTime()
                val (location, summary, group, bus) = parseLine(remaining, locationWords)
                Event(start = start, end = end, location = location, title = summary, group = group)
            }
            unDelimitedEventRegex.containsMatchIn(line) -> {
                val (_, startString, remaining) = unDelimitedEventRegex.find(line)!!.groupValues
                val start = startString.toTime()
                val end = start.plusHours(2)
                val (location, summary, group, bus) = parseLine(remaining, locationWords)
                Event(start = start, end = end, location = location, title = summary, group = group)
            }
            else -> null
        }
    }

    private fun String.toTime(): LocalTime = LocalTime.parse(this, DateTimeFormatter.ofPattern("HH'h'mm"))

    private fun parseLine(line: String, locationWords: Set<String>): Elements {
        // Example suffix: GF2 2,5 10h30
        val matchResult = Regex("""((GF|FN|FA)(\d{1,2})(bis)?)?\s*([0-9,]*)\s*(\d{1,2}[h:]\d{2})?$""").find(line)
        if (matchResult != null) {
            val (suffix, group, _, bus) = matchResult.groupValues
            val locationAndNature = line.replace(suffix, "").trim()
            val location = locationWords.firstOrNull { locationAndNature.contains(it) }?.trim()
            val nature = if (location != null) locationAndNature.replace(location, "") else locationAndNature
            return Elements(location = location ?: "", summary = nature, group = group, bus = bus)
        } else throw Exception("Invalid input")
    }
}

private class Day(val date: LocalDate, val formatted: String, val events: MutableList<Event> = mutableListOf())

private data class Elements(val location: String, val summary: String, val group: String, val bus: String)

private class FindRegionTextStripper(val leftWord: String, val rightWord: String) : PDFTextStripper() {
    init {
        this.sortByPosition = true
    }

    private var left: Float = 0F
    private var right: Float = 0F

    override fun writeString(text: String, textPositions: List<TextPosition>) {
        if (text.contains(leftWord) && text.contains(rightWord)) {
            val idx1 = text.indexOf(leftWord)
            left = textPositions[idx1].x

            val idx2 = text.indexOf(rightWord)
            right = textPositions[idx2].x
        }
    }

    fun getRegion(doc: PDDocument): Rectangle2D {
        getText(doc)
        val width = right - left
        val height = doc.getPage(0).mediaBox.height
        return Rectangle2D.Float(left, 0f, width, height)
    }
}
