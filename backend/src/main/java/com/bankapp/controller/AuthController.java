package com.bankapp.controller;

import com.bankapp.model.User;
import com.bankapp.security.JwtUtil;
import com.bankapp.service.AuthService;
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
        String identifier = request.identifier();
        if (identifier == null || identifier.isBlank() || request.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", (Object) "Email or username and password are required"));
        }

    return authService.login(identifier, request.getPassword())
        .map(user -> ResponseEntity.ok(Map.of(
            "token", jwtUtil.generateToken(user.getUsername(), Map.of(
                "role", user.getRole(),
                "userId", user.getId()
            )),
            "user", Map.of(
                "id", user.getId(),
                "name", resolveDisplayName(user),
                "fullName", resolveDisplayName(user),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole()
            ))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", (Object) "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()
                || request.getFullName() == null || request.getFullName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", (Object) "Full name, username, email, and password are required"));
        }

        try {
            User user = User.builder()
                    .username(request.getUsername())
                    .fullName(request.getFullName())
                    .password(request.getPassword())
                    .email(request.getEmail())
                    .role(request.getRole() != null ? request.getRole() : "ROLE_USER")
                    .build();
            User saved = authService.register(user);
            String token = jwtUtil.generateToken(saved.getUsername(), Map.of(
                    "role", saved.getRole(),
                    "userId", saved.getId()
            ));
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "token", token,
                    "user", Map.of(
                            "id", saved.getId(),
                            "name", resolveDisplayName(saved),
                            "fullName", resolveDisplayName(saved),
                            "username", saved.getUsername(),
                            "email", saved.getEmail(),
                            "role", saved.getRole()
                    )));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", (Object) ex.getMessage()));
        }
    }

    private String resolveDisplayName(User user) {
        String fullName = user.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return user.getUsername();
    }

    @GetMapping("/username-availability")
    public ResponseEntity<Map<String, Object>> checkUsernameAvailability(@RequestParam("username") String username) {
        boolean available = authService.isUsernameAvailable(username);
        if (!available) {
            return ResponseEntity.ok(Map.of(
                    "available", false,
                    "message", "Username is already taken"
            ));
        }

        return ResponseEntity.ok(Map.of("available", true));
    }

    public static class LoginRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String identifier() {
            if (email != null && !email.isBlank()) {
                return email;
            }
            return username;
        }
    }

    public static class RegisterRequest {
        private String username;
        private String fullName;
        private String password;
        private String email;
        private String role;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
