package io.github.olivierlemasle.planningOnpl

import java.io.File

fun main(args: Array<String>) {
    val base = File("/home/olivier/Documents/onpl/plannings")
    base.walkTopDown()
            .filter { it.extension == "pdf" }
            .forEach {
                val name = it.toRelativeString(base).padEnd(80)
                val parser = Parser(it.readBytes())
                val month = parser.extractMonth(parser.getLines()).toString()
                println("$name -> $month")
            }

    val bytes = base.walkTopDown()
            .first { it.extension == "pdf" && it.name.contains("Novembre-2017-Angers") }
            .readBytes()
    val parser = Parser(bytes)
    parser.extractEvents()!!
            .days
            .flatMap { day ->
                day.events.map { day.date to it }
            }.forEach { println(it) }

}
