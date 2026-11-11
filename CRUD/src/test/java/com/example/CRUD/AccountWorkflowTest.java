package com.example.CRUD;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
class AccountWorkflowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private String userToken;
    private String adminToken;

    @BeforeEach
    void setup() throws Exception {
        // Register a user
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "wfuser",
                        "email", "wfuser@test.com",
                        "password", "Test@1234"
                )))).andExpect(status().isOk());

        MvcResult userLogin = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "wfuser",
                        "password", "Test@1234"
                )))).andReturn();
        userToken = mapper.readTree(userLogin.getResponse().getContentAsString()).get("token").asText();

        MvcResult adminLogin = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", "admin",
                        "password", "Admin@LedgerLine1"
                )))).andReturn();
        adminToken = mapper.readTree(adminLogin.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void user_can_request_account_and_it_is_pending() throws Exception {
        mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void admin_can_approve_pending_account() throws Exception {
        MvcResult req = mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andReturn();

        Long accountId = mapper.readTree(req.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(post("/api/accounts/" + accountId + "/approve")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void admin_can_reject_pending_account() throws Exception {
        MvcResult req = mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andReturn();

        Long accountId = mapper.readTree(req.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(post("/api/accounts/" + accountId + "/reject")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void user_cannot_approve_accounts() throws Exception {
        MvcResult req = mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andReturn();

        Long accountId = mapper.readTree(req.getResponse().getContentAsString()).get("id").asLong();

        // Regular user must not be able to approve
        mvc.perform(post("/api/accounts/" + accountId + "/approve")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deposit_on_pending_account_is_blocked() throws Exception {
        MvcResult req = mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andReturn();

        Long accountId = mapper.readTree(req.getResponse().getContentAsString()).get("id").asLong();

        // Admin tries to deposit into a PENDING account — must fail
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", accountId,
                        "amount", "100.00",
                        "idempotencyKey", "test-key-deposit-pending",
                        "description", "test deposit"
                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_can_see_pending_accounts() throws Exception {
        mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/accounts/pending")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
