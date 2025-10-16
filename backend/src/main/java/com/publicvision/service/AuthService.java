package com.publicvision.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.publicvision.dto.JwtResponse;
import com.publicvision.dto.LoginRequest;
import com.publicvision.dto.RegisterRequest;
import com.publicvision.dto.UserDTO;
import com.publicvision.entity.User;
import com.publicvision.entity.User.Role;
import com.publicvision.repository.UserRepository;
import com.publicvision.security.JwtTokenProvider;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public JwtResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        org.springframework.security.core.userdetails.UserDetails principal
                = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
        String jwt = jwtTokenProvider.generateToken(principal);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long expiresIn = jwtTokenProvider.getJwtExpiration();
        JwtResponse resp = new JwtResponse(jwt, expiresIn, UserDTO.from(user));
        // refresh token placeholder (same as access for now)
        resp.setRefreshToken(jwt);
        return resp;
    }

    public UserDTO register(RegisterRequest registerRequest) {
        // Check if user already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        // Create new user
        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhone(registerRequest.getPhone());

        // Default role is CITIZEN unless specified
        Role role = Role.CITIZEN;
        if (registerRequest.getRole() != null) {
            try {
                role = Role.valueOf(registerRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // If invalid role is provided, default to CITIZEN
            }
        }
        user.setRole(role);

        User savedUser = userRepository.save(user);

        return UserDTO.from(savedUser);
    }

    public UserDTO getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserDTO.from(user);
    }
}
