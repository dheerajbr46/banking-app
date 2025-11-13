package com.bankapp.controller;

import com.bankapp.model.User;
import com.bankapp.security.JwtUtil;
import com.bankapp.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authService.login(request.getUsername(), request.getPassword())
                .map(user -> ResponseEntity.ok(Map.of(
                        "token", jwtUtil.generateToken(user.getUsername(), Map.of("role", user.getRole())),
                        "username", user.getUsername(),
                        "role", user.getRole())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = User.builder()
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .email(request.getEmail())
                    .role(request.getRole() != null ? request.getRole() : "ROLE_USER")
                    .build();
            User saved = authService.register(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", saved.getId(),
                    "username", saved.getUsername(),
                    "email", saved.getEmail(),
                    "role", saved.getRole()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        }
    }

    @Data
    private static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    private static class RegisterRequest {
        private String username;
        private String password;
        private String email;
        private String role;
    }
}
