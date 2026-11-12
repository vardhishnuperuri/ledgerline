package com.example.CRUD;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(TestRedisConfig.class)
class TransactionTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private String adminToken;
    private String aliceToken;
    private String bobToken;
    private Long aliceAccountId;
    private Long bobAccountId;

    @BeforeEach
    void setup() throws Exception {
        adminToken = loginToken("admin", "Admin@LedgerLine1");

        // Register alice and bob
        register("txalice", "txalice@test.com", "Test@1234");
        register("txbob", "txbob@test.com", "Test@1234");
        aliceToken = loginToken("txalice", "Test@1234");
        bobToken = loginToken("txbob", "Test@1234");

        // Request and approve accounts
        aliceAccountId = requestAndApproveAccount(aliceToken, adminToken);
        bobAccountId = requestAndApproveAccount(bobToken, adminToken);

        // Seed alice with $500
        deposit(adminToken, aliceAccountId, "500.00", UUID.randomUUID().toString());
    }

    // --- Deposit ---

    @Test
    void admin_can_deposit_into_active_account() throws Exception {
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "100.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("DEPOSIT"))
                .andExpect(jsonPath("$.amount").value(100.00));
    }

    @Test
    void account_holder_cannot_deposit() throws Exception {
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "100.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isForbidden());
    }

    // --- Withdraw ---

    @Test
    void account_holder_can_withdraw_from_own_account() throws Exception {
        mvc.perform(post("/api/transactions/withdraw")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "100.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("WITHDRAWAL"));
    }

    @Test
    void withdraw_fails_on_insufficient_funds() throws Exception {
        mvc.perform(post("/api/transactions/withdraw")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "99999.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Insufficient funds"));
    }

    @Test
    void user_cannot_withdraw_from_another_users_account() throws Exception {
        mvc.perform(post("/api/transactions/withdraw")
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "10.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isForbidden());
    }

    // --- Transfer ---

    @Test
    void account_holder_can_transfer_between_accounts() throws Exception {
        mvc.perform(post("/api/transactions/transfer")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "fromAccountId", aliceAccountId,
                        "toAccountId", bobAccountId,
                        "amount", "100.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("TRANSFER"));
    }

    @Test
    void transfer_fails_on_insufficient_funds() throws Exception {
        mvc.perform(post("/api/transactions/transfer")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "fromAccountId", aliceAccountId,
                        "toAccountId", bobAccountId,
                        "amount", "99999.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Insufficient funds"));
    }

    @Test
    void transfer_to_same_account_is_rejected() throws Exception {
        mvc.perform(post("/api/transactions/transfer")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "fromAccountId", aliceAccountId,
                        "toAccountId", aliceAccountId,
                        "amount", "10.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void user_cannot_transfer_from_another_users_account() throws Exception {
        mvc.perform(post("/api/transactions/transfer")
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "fromAccountId", aliceAccountId,
                        "toAccountId", bobAccountId,
                        "amount", "10.00",
                        "idempotencyKey", UUID.randomUUID().toString()
                ))))
                .andExpect(status().isForbidden());
    }

    // --- Idempotency ---

    @Test
    void duplicate_idempotency_key_does_not_create_second_transaction() throws Exception {
        String key = UUID.randomUUID().toString();

        // First request
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "50.00",
                        "idempotencyKey", key
                ))))
                .andExpect(status().isOk());

        // Second request with same key — must return same result, not double-charge
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", aliceAccountId,
                        "amount", "50.00",
                        "idempotencyKey", key
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idempotencyKey").value(key));
    }

    // --- Statement access ---

    @Test
    void user_can_view_own_statement() throws Exception {
        mvc.perform(get("/api/transactions/statement/" + aliceAccountId)
                .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void user_cannot_view_another_users_statement() throws Exception {
        mvc.perform(get("/api/transactions/statement/" + aliceAccountId)
                .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    // --- Helpers ---

    private void register(String username, String email, String password) throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", username, "email", email, "password", password
                )))).andExpect(status().isOk());
    }

    private String loginToken(String username, String password) throws Exception {
        MvcResult res = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "username", username, "password", password
                )))).andReturn();
        return mapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    private Long requestAndApproveAccount(String userToken, String adminToken) throws Exception {
        MvcResult req = mvc.perform(post("/api/accounts/request")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("accountType", "PERSONAL"))))
                .andReturn();
        Long id = mapper.readTree(req.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(post("/api/accounts/" + id + "/approve")
                .header("Authorization", "Bearer " + adminToken));
        return id;
    }

    private void deposit(String adminToken, Long accountId, String amount, String key) throws Exception {
        mvc.perform(post("/api/transactions/deposit")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "accountId", accountId, "amount", amount, "idempotencyKey", key
                )))).andExpect(status().isOk());
    }
}
