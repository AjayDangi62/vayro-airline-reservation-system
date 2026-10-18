package com.vayro.airline.service;

import com.vayro.airline.dto.AuthResponse;
import com.vayro.airline.dto.LoginRequest;
import com.vayro.airline.dto.RegisterRequest;
import com.vayro.airline.dto.UserResponse;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.Role;
import com.vayro.airline.exception.DuplicateResourceException;
import com.vayro.airline.exception.ResourceNotFoundException;
import com.vayro.airline.mapper.UserMapper;
import com.vayro.airline.repository.UserRepository;
import com.vayro.airline.security.JwtTokenProvider;
import com.vayro.airline.security.UserPrincipal;
import com.vayro.airline.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Spy
    private UserMapper userMapper = new UserMapper();

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Jane Doe", "jane@example.com", "hashed_pwd", "+1234567890", Role.USER);
        sampleUser.setId(1L);
        sampleUser.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should successfully register user with hashed password and USER role")
    void register_Success() {
        RegisterRequest request = new RegisterRequest("Jane Doe", "jane@example.com", "secret123", "+1234567890");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed_pwd");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateToken(anyString(), any(), anyString())).thenReturn("mocked.jwt.token");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("jane@example.com", response.getUser().getEmail());
        assertEquals(Role.USER, response.getUser().getRole());

        verify(passwordEncoder).encode("secret123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject registration with DuplicateResourceException when email already exists")
    void register_DuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Jane Doe", "jane@example.com", "secret123", "+1234567890");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully authenticate user and return JWT token")
    void login_Success() {
        LoginRequest request = new LoginRequest("jane@example.com", "secret123");
        UserPrincipal principal = new UserPrincipal(1L, "jane@example.com", "hashed_pwd", "Jane Doe", Role.USER, Collections.emptyList());
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtTokenProvider.generateToken(auth)).thenReturn("jwt.token.val");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86400000L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt.token.val", response.getToken());
        assertEquals("jane@example.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when login password is invalid")
    void login_InvalidCredentials() {
        LoginRequest request = new LoginRequest("jane@example.com", "wrongpwd");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should return current user profile successfully")
    void getCurrentUser_Success() {
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(sampleUser));

        UserResponse response = authService.getCurrentUser("jane@example.com");

        assertNotNull(response);
        assertEquals("Jane Doe", response.getFullName());
        assertEquals("jane@example.com", response.getEmail());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when current user email not found")
    void getCurrentUser_NotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.getCurrentUser("missing@example.com"));
    }
}
