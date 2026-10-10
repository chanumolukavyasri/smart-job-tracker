
package job_tracker_backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String email = request.get("email");
            String password = request.get("password");

            if (name == null || name.isBlank()
                    || email == null || email.isBlank()
                    || password == null || password.length() < 8) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Enter your name and email, and a password of at least 8 characters."));
            }

            User user = authService.register(name, email, password);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "message", "Account created successfully.",
                            "id", user.getId(),
                            "name", user.getName(),
                            "email", user.getEmail()
                    )
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || email.isBlank()
                    || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email and password are required."));
            }

            AuthService.LoginResult result =
                    authService.login(email, password);

            return ResponseEntity.ok(
                    Map.of(
                            "token", result.token(),
                            "id", result.id(),
                            "name", result.name(),
                            "email", result.email()
                    )
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password."));
        }
    }
}
