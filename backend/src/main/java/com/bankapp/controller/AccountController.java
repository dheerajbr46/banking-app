package com.bankapp.controller;

import com.bankapp.model.Account;
import com.bankapp.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<Account>> listAccounts(@RequestParam(name = "userId", defaultValue = "1") Long userId) {
        return ResponseEntity.ok(accountService.findAccountsForUser(userId));
    }
}
