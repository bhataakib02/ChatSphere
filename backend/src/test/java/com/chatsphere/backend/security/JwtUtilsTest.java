package com.chatsphere.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class JwtUtilsTest {

    @Autowired
    private JwtUtils jwtUtils;

    @Test
    void generatesAndValidatesToken() {
        UserDetailsImpl principal = new UserDetailsImpl(
                1L, "u1", "u1@t.com", "x", false,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        String jwt = jwtUtils.generateJwtToken(auth);
        assertNotNull(jwt);
        assertTrue(jwtUtils.validateJwtToken(jwt));
        assertEquals("u1", jwtUtils.getUserNameFromJwtToken(jwt));
    }
}
