package com.publicvision.security;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public long getJwtExpiration() {
        return jwtExpiration;
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }

    private Key getSigningKey() {
        byte[] raw = jwtSecret.getBytes();
        // HS512 requires >= 512 bits (64 bytes). If provided secret is shorter, derive a padded strong key.
        if (raw.length < 64) {
            // Deterministically stretch the secret using SHA-512 so restarts produce same key for same secret.
            try {
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-512");
                byte[] digest = md.digest(raw); // 64 bytes
                return Keys.hmacShaKeyFor(digest);
            } catch (Exception e) {
                // Fallback: pad with zeros (should not normally happen)
                byte[] padded = new byte[64];
                System.arraycopy(raw, 0, padded, 0, Math.min(raw.length, 64));
                return Keys.hmacShaKeyFor(padded);
            }
        }
        return Keys.hmacShaKeyFor(raw);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
