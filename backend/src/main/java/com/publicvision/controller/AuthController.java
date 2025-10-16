package com.publicvision.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.publicvision.dto.JwtResponse;
import com.publicvision.dto.LoginRequest;
import com.publicvision.dto.RegisterRequest;
import com.publicvision.dto.UserDTO;
import com.publicvision.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.login(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Register attempt email={} name={} phone={} ", registerRequest.getEmail(), registerRequest.getName(), registerRequest.getPhone());
        UserDTO userDTO = authService.register(registerRequest);
        log.info("Register success userId={} email={}", userDTO.getUserId(), userDTO.getEmail());
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("auth pong");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        UserDTO userDTO = authService.getCurrentUser();
        return ResponseEntity.ok(userDTO);
    }
}
