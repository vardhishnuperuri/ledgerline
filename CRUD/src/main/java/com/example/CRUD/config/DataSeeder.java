package com.example.CRUD.config;

import com.example.CRUD.entity.Account;
import com.example.CRUD.entity.User;
import com.example.CRUD.repository.AccountRepository;
import com.example.CRUD.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:Admin@LedgerLine1}")
    private String adminPassword;

    @Value("${app.admin.email:admin@ledgerline.com}")
    private String adminEmail;

    public DataSeeder(UserRepository userRepository, AccountRepository accountRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Ensure admin exists
        ensureUser(adminUsername, adminPassword, adminEmail, User.Role.ADMIN);

        // Seed demo users
        User alice = ensureUser("alice", "test123", "alice@ledgerline.com", User.Role.ACCOUNT_HOLDER);
        User bob   = ensureUser("bob",   "test123", "bob@ledgerline.com",   User.Role.ACCOUNT_HOLDER);
        ensureUser("auditor", "test123", "auditor@ledgerline.com", User.Role.AUDITOR);

        // Seed demo accounts (only if alice/bob have no accounts yet)
        if (alice != null && accountRepository.findByOwnerId(alice.getId()).isEmpty()) {
            createAccount(alice, "ACC-ALICE-001", new BigDecimal("5000.00"));
        }
        if (bob != null && accountRepository.findByOwnerId(bob.getId()).isEmpty()) {
            createAccount(bob, "ACC-BOB-001", new BigDecimal("3000.00"));
        }
    }

    /**
     * Creates user if not present, or fixes placeholder hash if present.
     * Returns the user entity (existing or newly created), or null on error.
     */
    private User ensureUser(String username, String rawPassword, String email, User.Role role) {
        return userRepository.findByUsername(username).map(user -> {
            if (user.getPassword().contains("placeholder")) {
                user.setPassword(passwordEncoder.encode(rawPassword));
                userRepository.save(user);
                log.info("Password fixed for user: {}", username);
            }
            return user;
        }).orElseGet(() -> {
            if (userRepository.existsByEmail(email)) {
                log.warn("Email {} already taken, skipping seed user {}", email, username);
                return null;
            }
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEmail(email);
            user.setRole(role);
            userRepository.save(user);
            log.info("Seed user created: {} ({})", username, role);
            return user;
        });
    }

    private void createAccount(User owner, String accountNumber, BigDecimal balance) {
        Account account = new Account();
        account.setOwner(owner);
        account.setAccountNumber(accountNumber);
        account.setBalance(balance);
        account.setCurrency("USD");
        account.setStatus(Account.Status.ACTIVE);
        account.setAccountType(Account.AccountType.PERSONAL);
        accountRepository.save(account);
        log.info("Seed account created: {} for {}", accountNumber, owner.getUsername());
    }
}
