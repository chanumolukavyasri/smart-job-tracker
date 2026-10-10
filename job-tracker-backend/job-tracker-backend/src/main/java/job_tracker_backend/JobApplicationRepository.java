package job_tracker_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository
        extends JpaRepository<JobApplication, Long> {

    List<JobApplication> findAllByUser_EmailOrderByIdDesc(String email);

    Optional<JobApplication> findByIdAndUser_Email(Long id, String email);
}