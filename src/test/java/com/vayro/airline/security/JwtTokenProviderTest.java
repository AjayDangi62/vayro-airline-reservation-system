package com.vayro.airline.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "TestSecretKeyMustBeAtLeast256BitsLongForHmacSha256Security123456";
    private final long expirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    @DisplayName("Should generate valid JWT and successfully extract subject email")
    void generateAndValidateToken_Success() {
        String email = "pilot@vayro.com";
        String token = jwtTokenProvider.generateToken(email, 42L, "USER");

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    @DisplayName("Should reject malformed JWT token")
    void validateToken_Malformed() {
        assertFalse(jwtTokenProvider.validateToken("not.a.valid.jwt.token"));
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void validateToken_Expired() {
        // Create token provider with 0 ms expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(secret, -1000);
        String expiredToken = shortLivedProvider.generateToken("expired@vayro.com", 1L, "USER");

        assertFalse(jwtTokenProvider.validateToken(expiredToken));
    }

    @Test
    @DisplayName("Should reject empty or null token")
    void validateToken_Empty() {
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(null));
    }
}
