package io.github.olivierlemasle.planningOnpl

import java.io.File

fun main(args: Array<String>) {
    val base = File("/home/olivier/Documents/onpl/plannings")
    base.walkTopDown()
            .filter { it.extension == "pdf" }
            .forEach {
                val name = it.toRelativeString(base).padEnd(80)
                val lines = Parser.getLines(it.readBytes())
                val month = Parser.extractMonth(lines).toString()
                println("$name -> $month")
            }

    val lines = Parser.getLines(
            bytes = base.walkTopDown()
            .first { it.extension == "pdf" && it.name.contains("Novembre-2017-Angers")}
            .readBytes()
    )
    Parser.extractEvents(lines, Parser.extractMonth(lines)!!)
}
