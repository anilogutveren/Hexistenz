package com.ai.n8n

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class N8nApplication

fun main(args: Array<String>) {
	runApplication<N8nApplication>(*args)
}
