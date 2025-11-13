package com.bankapp.service;

import com.bankapp.model.Transaction;
import com.bankapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public List<Transaction> findTransactionsForAccount(Long accountId) {
        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId);
    }
}
