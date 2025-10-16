package com.publicvision.dto;

import com.publicvision.entity.User;

public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private long expiresIn;
    private UserDTO user;
    private String refreshToken;

    public JwtResponse() {
    }

    public JwtResponse(String token, String type, long expiresIn, UserDTO user, String refreshToken) {
        this.token = token;
        this.type = type;
        this.expiresIn = expiresIn;
        this.user = user;
        this.refreshToken = refreshToken;
    }

    public JwtResponse(String token, long expiresIn, UserDTO user) {
        this.token = token;
        this.expiresIn = expiresIn;
        this.user = user;
        this.refreshToken = token; // simple same-token refresh placeholder
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public static JwtResponse from(String token, long expiresIn, User user) {
        return new JwtResponse(token, expiresIn, UserDTO.from(user));
    }
}
