package com.bankapp.service;

import com.bankapp.model.User;
import com.bankapp.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void ensurePasswordsEncoded() {
        userRepository.findAll().stream()
                .filter(user -> user.getPassword() != null && !isPasswordEncoded(user.getPassword()))
                .forEach(user -> {
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                    userRepository.save(user);
                });
    }

    public Optional<User> login(String identifier, String password) {
        if (identifier == null || identifier.isBlank() || password == null || password.isBlank()) {
            return Optional.empty();
        }

        Optional<User> candidate = resolveUser(identifier.trim());

        if (candidate.isEmpty()) {
            return Optional.empty();
        }

        User user = candidate.get();
        if (user.getPassword() == null) {
            return Optional.empty();
        }

        if (isPasswordEncoded(user.getPassword())) {
            return passwordEncoder.matches(password, user.getPassword()) ? Optional.of(user) : Optional.empty();
        }

        if (user.getPassword().equals(password)) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
            return Optional.of(user);
        }

        return Optional.empty();
    }

    public User register(User user) {
        String normalizedEmail = user.getEmail().trim().toLowerCase(Locale.ROOT);
        String normalizedUsername = user.getUsername().trim();
        String normalizedFullName = user.getFullName() != null ? user.getFullName().trim() : "";

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (normalizedFullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("ROLE_USER");
        }
        user.setEmail(normalizedEmail);
        user.setUsername(normalizedUsername);
        user.setFullName(normalizedFullName);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public boolean isUsernameAvailable(String username) {
        if (username == null) {
            return false;
        }
        String candidate = username.trim();
        if (candidate.isEmpty()) {
            return false;
        }
        return !userRepository.existsByUsernameIgnoreCase(candidate);
    }

    private Optional<User> resolveUser(String identifier) {
        String candidate = identifier.trim();
        Optional<User> user;
        if (candidate.contains("@")) {
            user = userRepository.findByEmailIgnoreCase(candidate);
        } else {
            user = userRepository.findByUsernameIgnoreCase(candidate);
        }

        if (user.isEmpty()) {
            user = userRepository.findByEmailIgnoreCase(candidate);
        }

        return user;
    }

    private boolean isPasswordEncoded(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }
}
