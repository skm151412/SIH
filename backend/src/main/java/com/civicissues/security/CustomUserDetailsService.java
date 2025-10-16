package com.civicissues.security;

import com.civicissues.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;

// @Service DISABLED: Legacy civicissues security no longer used; using publicvision security stack instead
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired(required = false)
    @SuppressWarnings("unused")
    private UserRepository userRepository; // optional legacy repository reference

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        throw new UsernameNotFoundException("Legacy civicissues security disabled");
    }
}
