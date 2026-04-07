package com.chatsphere.backend.controller;

import com.chatsphere.backend.dto.*;
import com.chatsphere.backend.model.ERole;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.UserRepository;
import com.chatsphere.backend.security.JwtUtils;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            User user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);
            if (user != null) {
                if (user.isLocked()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Your account has been banned."));
                }
                if (!user.isVerified()) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Account not verified. Please check your email."));
                }
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String role = userDetails.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("");
            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), userDetails.getEmail(), role));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Invalid username or password."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Error: An unexpected error occurred."));
        }
    }

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void dropEmailConstraint() {
        try {
            jdbcTemplate.execute("DO $$ DECLARE constraint_name text; BEGIN " +
                "SELECT tc.constraint_name INTO constraint_name " +
                "FROM information_schema.table_constraints tc " +
                "JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) " +
                "WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = 'users' AND ccu.column_name = 'email'; " +
                "IF constraint_name IS NOT NULL THEN " +
                "EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name; " +
                "END IF; END $$;");
        } catch (Exception e) {
            // Log or ignore if executed on an unsupported dialect
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        String vCode = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .role(ERole.ROLE_USER)
                .online(false)
                .isVerified(false)
                .build();
        user.setVerificationCode(vCode);
        userRepository.save(user);

        new Thread(() -> {
            emailService.sendVerificationCode(user.getEmail(), vCode);
        }).start();

        return ResponseEntity.ok(new MessageResponse("Registration successful! Your code is: " + vCode));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestBody VerificationRequest dr) {
        return userRepository.findByUsername(dr.getUsername()).map(user -> {
            if (user.getVerificationCode() != null && user.getVerificationCode().equals(dr.getCode())) {
                user.setVerified(true);
                user.setVerificationCode(null);
                userRepository.save(user);
                return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
            }
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid verification code."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail()).map(user -> {
            String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            user.setResetPasswordCode(code);
            userRepository.save(user);
            emailService.sendPasswordResetCode(user.getEmail(), code);
            return ResponseEntity.ok(new MessageResponse("Recovery code sent to your email."));
        }).orElse(ResponseEntity.badRequest().body(new MessageResponse("Error: Email not found.")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail()).map(user -> {
            if (user.getResetPasswordCode() != null && user.getResetPasswordCode().equals(request.getCode())) {
                user.setPassword(encoder.encode(request.getNewPassword()));
                user.setResetPasswordCode(null);
                userRepository.save(user);
                return ResponseEntity.ok(new MessageResponse("Password reset successfully. You can now log in."));
            }
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid recovery code."));
        }).orElse(ResponseEntity.badRequest().body(new MessageResponse("Error: User not found.")));
    }
}
