package com.bankapp.service;

import com.bankapp.model.Account;
import com.bankapp.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public List<Account> findAccountsForUser(Long userId) {
        return accountRepository.findByUserId(userId);
    }
}
