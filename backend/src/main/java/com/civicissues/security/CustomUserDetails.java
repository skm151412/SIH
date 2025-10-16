package com.civicissues.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUserDetails extends User {

    private final Long id;
    private final String email;
    private final boolean active;

    public CustomUserDetails(
            Long id,
            String username,
            String email,
            String password,
            Collection<? extends GrantedAuthority> authorities,
            boolean active) {
        super(username, password, active, true, true, true, authorities);
        this.id = id;
        this.email = email;
        this.active = active;
    }
}
