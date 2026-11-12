package com.example.CRUD;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(TestRedisConfig.class)
class AuthIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @Test
    void register_and_login_succeeds() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser1",
                        "email", "testuser1@test.com",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully"));

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser1",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ACCOUNT_HOLDER"));
    }

    @Test
    void login_with_wrong_password_fails() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser2",
                        "email", "testuser2@test.com",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser2",
                        "password", "wrongpassword"
                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicate_username_registration_fails() throws Exception {
        Map<String, String> body = Map.of(
                "username", "testuser3",
                "email", "testuser3@test.com",
                "password", "Test@1234"
        );
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser3",
                        "email", "other3@test.com",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticated_request_to_protected_endpoint_returns_401() throws Exception {
        mvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void account_holder_cannot_access_admin_users_endpoint() throws Exception {
        // Register a regular user and get token
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser4",
                        "email", "testuser4@test.com",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk());

        MvcResult loginResult = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser4",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk())
                .andReturn();

        String token = mapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        // Account holder must not reach admin-only endpoint
        mvc.perform(get("/api/auth/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void account_holder_cannot_access_pending_accounts_endpoint() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser5",
                        "email", "testuser5@test.com",
                        "password", "Test@1234"
                ))))
                .andExpect(status().isOk());

        MvcResult loginResult = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "testuser5",
                        "password", "Test@1234"
                ))))
                .andReturn();

        String token = mapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        mvc.perform(get("/api/accounts/pending")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_login_succeeds() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "admin",
                        "password", "Admin@LedgerLine1"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
