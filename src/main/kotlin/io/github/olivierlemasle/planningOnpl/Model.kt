package io.github.olivierlemasle.planningOnpl

import java.io.Serializable
import java.time.LocalDate
import java.time.LocalTime

data class Event(
        val start: LocalTime,
        val end: LocalTime,
        val title: String,
        val location: String,
        val group: String
) : Serializable

data class CalendarDay(val date: LocalDate, val events: List<Event>) : Serializable

data class CalendarMonth(val month: LocalDate, val days: List<CalendarDay>) : Serializable

data class UserInfo(val userId: String? = null, val nickName: String? = null,
                    val loginUrl: String? = null, val logoutUrl: String? = null) : Serializable

data class BooleanResult(val result: Boolean) : Serializable

data class SynchResult(val removed: Int, val added: Int)
