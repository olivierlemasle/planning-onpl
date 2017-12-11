package io.github.olivierlemasle.planningOnpl

import com.google.api.client.googleapis.batch.json.JsonBatchCallback
import com.google.api.client.googleapis.json.GoogleJsonError
import com.google.api.client.http.GenericUrl
import com.google.api.client.http.HttpHeaders
import com.google.api.client.util.DateTime
import com.google.api.services.calendar.model.Event.ExtendedProperties
import com.google.api.services.calendar.model.EventDateTime
import com.google.appengine.api.memcache.MemcacheServiceFactory
import com.google.appengine.api.users.UserServiceFactory
import com.google.common.hash.Hashing
import spark.kotlin.Http
import spark.kotlin.halt
import spark.kotlin.ignite
import spark.servlet.SparkApplication
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.logging.Level
import java.util.logging.Logger

class MainApp : SparkApplication {
    private val hashFunction = Hashing.murmur3_128()
    private val logger = Logger.getLogger(MainApp::class.java.name)

    override fun init() {
        val http: Http = ignite()

        http.post("/api/upload") {
            val bytes = request.bodyAsBytes()
            if (bytes.isEmpty()) {
                response.status(400)
                return@post "Empty document"
            }

            val hash = hashFunction.hashBytes(bytes)
            val cache = MemcacheServiceFactory.getMemcacheService()
            val cachedData = cache.get(hash) as? CalendarMonth?
            val calendarMonth = if (cachedData == null) {
                logger.info("Parsing document")
                val parser = Parser(bytes)
                val calendarMonth = parser.extractEvents()
                cache.put(hash, calendarMonth)
                calendarMonth
            } else {
                logger.info("Using cached value")
                cachedData
            }

            if (calendarMonth == null) {
                response.status(400)
                return@post "Invalid document"
            }

            response.type("application/json")
            gson.toJson(calendarMonth)
        }

        http.before("/api/protected/*") {
            if (!UserServiceFactory.getUserService().isUserLoggedIn) {
                halt(401, "Unauthenticated!")
            }
            if (Utils.loadGCalendarClient() == null && request.pathInfo() !in listOf(
                    "/api/protected/auth",
                    "/api/protected/gCalendar"
            )) {
                halt(403, "Unauthorized!")
            }
        }

        http.get("/api/user") {
            val userService = UserServiceFactory.getUserService()
            val returnUrl = GenericUrl(request.url())
                    .apply { rawPath = "/" }
                    .build()
            response.type("application/json")
            if (userService.isUserLoggedIn) {
                gson.toJson(UserInfo(
                        userId = userService.currentUser.userId,
                        nickName = userService.currentUser.nickname,
                        logoutUrl = userService.createLogoutURL(returnUrl)))
            } else {
                gson.toJson(UserInfo(
                        loginUrl = userService.createLoginURL(returnUrl)))
            }
        }

        http.get("/api/protected/gCalendar") {
            response.type("application/json")
            val calendar = Utils.loadGCalendarClient()
            (if (calendar == null) {
                false
            } else try {
                calendar.calendarList()
                        .list()
                        .setMaxResults(1)
                        .execute()
                true
            } catch (e: Exception) {
                Utils.deleteGCalendarCredential()
                false
            }).toWrappedJson()
        }

        http.get("/api/protected/revoke") {
            Utils.revokeGCalendarAccess().toWrappedJson()
        }

        http.get("/api/protected/calendars") {
            try {
                val calendars = Utils.loadGCalendarClient()!!
                        .calendarList()
                        .list()
                        .setMinAccessRole("writer")
                        .execute()
                        .items
                response.type("application/json")
                gson.toJson(calendars)
            } catch (e: Exception) {
                e.printStackTrace()
                halt(500, e.toString())
            }
        }

        http.post("/api/protected/push/:calendarId") {
            try {
                val calendarId = request.params(":calendarId")
                val month = gson.fromJson(request.body(), CalendarMonth::class.java)
                val zone = ZoneId.of("Europe/Paris")

                val calendarApi = Utils.loadGCalendarClient()!!
                val batchRequest = calendarApi.batch()

                var nDeleted = 0
                var nAdded = 0

                val startMonth = ZonedDateTime.of(month.month, LocalTime.MIN, zone)
                val min = startMonth.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                val max = startMonth.plusMonths(1).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                var pageToken: String? = null
                do {
                    val events = calendarApi.events()
                            .list(calendarId)
                            .setSharedExtendedProperty(listOf("onpl=true"))
                            .setTimeMin(DateTime(min))
                            .setTimeMax(DateTime(max))
                            .setPageToken(pageToken)
                            .execute()
                    events.items.forEach { event ->
                        calendarApi.events()
                                .delete(calendarId, event.id)
                                .queue(batchRequest, object : JsonBatchCallback<Void>() {
                                    override fun onSuccess(e: Void?, responseHeaders: HttpHeaders?) {
                                        nDeleted++
                                    }

                                    override fun onFailure(e: GoogleJsonError, responseHeaders: HttpHeaders?) {
                                        logger.log(Level.SEVERE, "Failure deleting event", e)
                                    }
                                })
                    }
                    pageToken = events.nextPageToken
                } while (pageToken != null)
                if (batchRequest.size() > 0)
                    batchRequest.execute()
                println("$nDeleted events deleted")

                month.days.forEach { day ->
                    day.events.map {
                        val start = ZonedDateTime.of(day.date, it.start, zone)
                        var end = ZonedDateTime.of(day.date, it.end, zone)

                        if (end.isBefore(start)) {
                            end = end.plusDays(1)
                        }

                        val startString = start.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                        val endString = end.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)

                        com.google.api.services.calendar.model.Event()
                                .setSummary("${it.title} - ${it.group}")
                                .setLocation(it.location)
                                .setStart(EventDateTime().setDateTime(DateTime(startString)).setTimeZone("Europe/Paris"))
                                .setEnd(EventDateTime().setDateTime(DateTime(endString)).setTimeZone("Europe/Paris"))
                                .setExtendedProperties(ExtendedProperties()
                                        .setShared(mapOf("onpl" to "true"))
                                )
                    }.forEach { event ->
                        calendarApi.events()
                                .insert(calendarId, event)
                                .queue(batchRequest, object : JsonBatchCallback<com.google.api.services.calendar.model.Event>() {
                                    override fun onSuccess(e: com.google.api.services.calendar.model.Event, responseHeaders: HttpHeaders?) {
                                        nAdded++
                                    }

                                    override fun onFailure(e: GoogleJsonError, responseHeaders: HttpHeaders?) {
                                        logger.log(Level.SEVERE, "Failure adding event", e)
                                    }
                                })
                    }
                }

                if (batchRequest.size() > 0)
                    batchRequest.execute()
                println("$nAdded events added")
                response.type("application/json")
                gson.toJson(SynchResult(added = nAdded, removed = nDeleted))
            } catch (e: Exception) {
                logger.log(Level.SEVERE, "Exception during synch", e)
                response.type("application/json")
                response.status(400)
                gson.toJson(SynchResult(added = 0, removed = 0))
            }
        }

    }
}

