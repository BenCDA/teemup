package com.teemup.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.refresh-secret}")
    private String refreshSecretKey;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaim(token, claims -> claims.get("userId", String.class)));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails, UUID userId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", userId.toString());
        return generateToken(extraClaims, userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration, getSigningKey());
    }

    public String generateRefreshToken(UserDetails userDetails, UUID userId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", userId.toString());
        return buildToken(extraClaims, userDetails, refreshExpiration, getRefreshSigningKey());
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, Long expiration, SecretKey key) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        try {
            final Claims claims = extractAllClaims(token, getRefreshSigningKey());
            final String username = claims.getSubject();
            final Date expiration = claims.getExpiration();
            return (username.equals(userDetails.getUsername())) && !expiration.before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUsernameFromRefreshToken(String token) {
        return extractAllClaims(token, getRefreshSigningKey()).getSubject();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return extractAllClaims(token, getSigningKey());
    }

    private Claims extractAllClaims(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getRefreshSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(refreshSecretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Long getJwtExpiration() {
        return jwtExpiration;
    }
}
