package com.chatsphere.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(max = 120)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    private String profilePhoto;
    private String profilePicture;

    private String bio;
    @Column(columnDefinition = "TEXT")
    private String publicKey;

    private LocalDateTime lastSeen;
    private boolean online;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole role;

    private boolean locked = false;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
    public ERole getRole() { return role; }
    public void setRole(ERole role) { this.role = role; }
    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public static UserBuilder builder() { return new UserBuilder(); }

    public static class UserBuilder {
        private String username;
        private String email;
        private String password;
        private ERole role;
        private boolean online;
        private boolean locked = false;

        public UserBuilder username(String v) { this.username = v; return this; }
        public UserBuilder email(String v) { this.email = v; return this; }
        public UserBuilder password(String v) { this.password = v; return this; }
        public UserBuilder role(ERole v) { this.role = v; return this; }
        public UserBuilder online(boolean v) { this.online = v; return this; }
        public UserBuilder locked(boolean v) { this.locked = v; return this; }

        public User build() {
            User u = new User();
            u.setUsername(username);
            u.setEmail(email);
            u.setPassword(password);
            u.setRole(role);
            u.setOnline(online);
            u.setLocked(locked);
            return u;
        }
    }
}
