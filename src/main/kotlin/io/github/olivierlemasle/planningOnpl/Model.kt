package io.github.olivierlemasle.planningOnpl

import java.time.LocalDate
import java.time.LocalTime

data class Event(val start: LocalTime, val end: LocalTime, val title: String, val location: String)

data class CalendarDay(val date: LocalDate, val events: List<Event>)

data class CalendarMonth(val month: LocalDate, val days: List<CalendarDay>)

data class UserInfo(val userId: String? = null, val nickName: String? = null,
                    val loginUrl: String? = null, val logoutUrl: String? = null)

class BooleanResult(val result: Boolean)
