package com.bankapp.controller;

import com.bankapp.model.Transaction;
import com.bankapp.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<Transaction>> listTransactions(@RequestParam(name = "accountId") Long accountId) {
        return ResponseEntity.ok(transactionService.findTransactionsForAccount(accountId));
    }
}
