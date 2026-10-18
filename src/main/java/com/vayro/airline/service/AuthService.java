package com.vayro.airline.service;

import com.vayro.airline.dto.AuthResponse;
import com.vayro.airline.dto.LoginRequest;
import com.vayro.airline.dto.RegisterRequest;
import com.vayro.airline.dto.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}
