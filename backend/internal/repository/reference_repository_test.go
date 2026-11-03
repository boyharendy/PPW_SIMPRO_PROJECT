package repository_test

import (
	"testing"

	"simpro-backend/internal/repository"
)

func TestMemoryReferenceRepository(t *testing.T) {
	repo := repository.NewMemoryReferenceRepository()

	periods, err := repo.GetAcademicPeriods()
	if err != nil {
		t.Fatalf("GetAcademicPeriods failed: %v", err)
	}
	if len(periods) == 0 {
		t.Errorf("expected at least 1 academic period")
	}

	courses, err := repo.GetCourses()
	if err != nil {
		t.Fatalf("GetCourses failed: %v", err)
	}
	if len(courses) == 0 {
		t.Errorf("expected at least 1 course")
	}

	classes, err := repo.GetCourseClasses()
	if err != nil {
		t.Fatalf("GetCourseClasses failed: %v", err)
	}
	if len(classes) == 0 {
		t.Errorf("expected at least 1 course class")
	}

	partners, err := repo.GetPartners()
	if err != nil {
		t.Fatalf("GetPartners failed: %v", err)
	}
	if len(partners) == 0 {
		t.Errorf("expected at least 1 partner")
	}
}

