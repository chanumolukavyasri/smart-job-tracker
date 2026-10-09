
package job_tracker_backend;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobApplicationController {

    private final JobApplicationRepository repository;

    public JobApplicationController(JobApplicationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<JobApplication> getAllJobs() {
        return repository.findAll();
    }

    @PostMapping
    public JobApplication addJob(@RequestBody JobApplication job) {
        return repository.save(job);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobApplication> updateJob(
            @PathVariable Long id,
            @RequestBody JobApplication updatedJob) {

        return repository.findById(id)
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
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
