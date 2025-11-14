package com.bankapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BankingBackendApplication {

    public static void main(String[] args) {
        // CI trigger: backend deploy pipeline
        SpringApplication.run(BankingBackendApplication.class, args);
    }
}
