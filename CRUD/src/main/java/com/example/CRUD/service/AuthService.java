package com.example.CRUD.service;

import com.example.CRUD.dto.CreateUserRequest;
import com.example.CRUD.dto.LoginRequest;
import com.example.CRUD.dto.RegisterRequest;
import com.example.CRUD.entity.User;
import com.example.CRUD.repository.UserRepository;
import com.example.CRUD.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
    }

    public Map<String, String> register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email already registered");

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setEmail(req.getEmail());
        user.setRole(User.Role.ACCOUNT_HOLDER);
        userRepository.save(user);

        auditService.log(req.getUsername(), "REGISTER", "USER", user.getId(), "New account holder registered");
        return Map.of("message", "User registered successfully");
    }

    public Map<String, String> login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new IllegalArgumentException("Invalid credentials");

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        auditService.log(user.getUsername(), "LOGIN", "USER", user.getId(), "User logged in");
        return Map.of("token", token, "role", user.getRole().name(), "username", user.getUsername());
    }

    public Map<String, String> createUser(CreateUserRequest req, String actor) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email already registered");

        User.Role role;
        try {
            role = User.Role.valueOf(req.getRole().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role. Must be ADMIN, ACCOUNT_HOLDER, or AUDITOR", e);
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setEmail(req.getEmail());
        user.setRole(role);
        userRepository.save(user);

        auditService.log(actor, "CREATE_USER", "USER", user.getId(),
                "Admin created user: " + req.getUsername() + " with role " + role);
        return Map.of("message", "User created successfully", "username", user.getUsername(), "role", role.name());
    }

    public List<Map<String, Object>> listUsers() {
        return userRepository.findAll().stream().map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "username", u.getUsername(),
                "email", u.getEmail(),
                "role", u.getRole().name(),
                "createdAt", u.getCreatedAt().toString()
        )).collect(Collectors.toList());
    }
}
