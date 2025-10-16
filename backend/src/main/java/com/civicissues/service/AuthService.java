package com.civicissues.service;

import com.civicissues.domain.model.RefreshToken;
import com.civicissues.domain.model.User;
import com.civicissues.dto.auth.JwtResponse;
import com.civicissues.dto.auth.LoginRequest;
import com.civicissues.dto.auth.RefreshTokenRequest;
import com.civicissues.dto.auth.SignupRequest;
import com.civicissues.exception.RefreshTokenException;
import com.civicissues.repository.RefreshTokenRepository;
import com.civicissues.security.CustomUserDetails;
import com.civicissues.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${app.jwt.refresh-expiration}")
    private Long refreshTokenDurationMs;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String jwt = tokenProvider.generateToken(authentication);
        RefreshToken refreshToken = createRefreshToken(userDetails.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new JwtResponse(
                jwt,
                refreshToken.getToken(),
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles);
    }

    public RefreshToken createRefreshToken(Long userId) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(User.builder().id(userId).build());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        refreshToken = refreshTokenRepository.save(refreshToken);
        return refreshToken;
    }

    public JwtResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenRepository.findByToken(requestRefreshToken)
                .map(this::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = tokenProvider.generateTokenFromUsername(user.getUsername());

                    return new JwtResponse(
                            token,
                            requestRefreshToken,
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            userService.getUserRoles(user.getId())
                    );
                })
                .orElseThrow(() -> new RefreshTokenException(
                requestRefreshToken, "Refresh token not found in database!"));
    }

    @Transactional
    public void signOutUser(Long userId) {
        refreshTokenRepository.deleteByUser(User.builder().id(userId).build());
    }

    @Transactional
    public void deleteRefreshToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RefreshTokenException(
                    token.getToken(), "Refresh token was expired. Please make a new sign in request");
        }

        return token;
    }

    @Transactional
    public void registerUser(SignupRequest signupRequest) {
        userService.createUser(signupRequest);
    }
}
