package io.github.olivierlemasle.planningOnpl

import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonWriter
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

internal val gson = GsonBuilder()
        .registerTypeAdapter(LocalDate::class.java, LocalDateAdapter())
        .registerTypeAdapter(LocalTime::class.java, LocalTimeAdapter())
        .create()

internal val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE
internal val timeFormatter = DateTimeFormatter.ISO_LOCAL_TIME

internal class LocalDateAdapter : TypeAdapter<LocalDate>() {
    override fun read(input: JsonReader): LocalDate = LocalDate.parse(input.nextString(), dateFormatter)

    override fun write(out: JsonWriter, date: LocalDate) {
        out.value(date.format(dateFormatter))
    }
}

internal class LocalTimeAdapter : TypeAdapter<LocalTime>() {
    override fun read(input: JsonReader): LocalTime = LocalTime.parse(input.nextString(), timeFormatter)

    override fun write(out: JsonWriter, time: LocalTime) {
        out.value(time.format(timeFormatter))
    }
}

fun Boolean.toWrappedJson(): String = gson.toJson(BooleanResult(result = this))
