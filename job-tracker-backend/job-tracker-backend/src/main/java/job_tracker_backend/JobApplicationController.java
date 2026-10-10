package job_tracker_backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobApplicationController {

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;

    public JobApplicationController(
            JobApplicationRepository repository,
            UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<JobApplication> getAllJobs(Authentication authentication) {
        return repository.findAllByUser_EmailOrderByIdDesc(
                authentication.getName());
    }

    @PostMapping
    public ResponseEntity<?> addJob(
            @RequestBody JobApplication job,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        job.setUser(user);

        JobApplication savedJob = repository.save(job);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedJob);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(
            @PathVariable Long id,
            @RequestBody JobApplication updatedJob,
            Authentication authentication) {

        return repository.findByIdAndUser_Email(
                id, authentication.getName())
                .map(job -> {
                    job.setCompany(updatedJob.getCompany());
                    job.setRole(updatedJob.getRole());
                    job.setDate(updatedJob.getDate());
                    job.setStatus(updatedJob.getStatus());

                    return ResponseEntity.ok(repository.save(job));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(
            @PathVariable Long id,
            Authentication authentication) {

        return repository.findByIdAndUser_Email(
                id, authentication.getName())
                .map(job -> {
                    repository.delete(job);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}