package usecase_test

import (
	"testing"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
	"simpro-backend/internal/usecase"
)

func TestEvaluationUsecase(t *testing.T) {
	repo := repository.NewMemoryEvaluationRepository()
	uc := usecase.NewEvaluationUsecase(repo)

	// 1. Save draft
	eval := &model.CourseEvaluation{
		ID:                  "eval-1",
		CourseClassID:       "cc1",
		IndeksKepuasanMhs:   4.5,
		PersentaseKelulusan: 95.0,
		CPMKList: []*model.CpmkEvaluation{
			{KodeCPMK: "CPMK-1", TargetKetercapaian: 80, RealisasiKetercapaian: 85},
		},
	}
	saved, err := uc.SaveEvaluation(eval)
	if err != nil {
		t.Fatalf("SaveEvaluation failed: %v", err)
	}
	if saved.IsSubmitted {
		t.Errorf("expected draft (not submitted)")
	}

	// 2. Submit evaluation
	err = uc.SubmitEvaluation("cc1")
	if err != nil {
		t.Fatalf("SubmitEvaluation failed: %v", err)
	}
	found, _ := uc.GetEvaluationByClass("cc1")
	if !found.IsSubmitted {
		t.Errorf("expected submitted = true")
	}

	// 3. Get Student Feedback (EDOM)
	feedback, err := uc.GetStudentFeedback("eval-1")
	if err != nil {
		t.Fatalf("GetStudentFeedback failed: %v", err)
	}
	if feedback.SkorRataRata <= 0 {
		t.Errorf("expected positive average feedback score")
	}

	// 4. Review GKM & Auto-Forwarding Recommendation
	newPlans := []*model.CourseImprovementPlan{
		{
			ID:              "gkm-plan-1",
			CourseID:        "c1",
			Rekomendasi:     "Tingkatkan porsi praktikum hands-on di lab",
			StatusPenerapan: "BELUM_DITERAPKAN",
		},
	}
	err = uc.ReviewEvaluation("eval-1", "gkm-lead", "Evaluasi pembelajaran berjalan baik, perlu penguatan lab", "DISETUJUI_DENGAN_CATATAN", newPlans)
	if err != nil {
		t.Fatalf("ReviewEvaluation failed: %v", err)
	}

	// 5. Recap
	recap, err := uc.GetRecap()
	if err != nil || recap.TotalEvaluasi != 1 || recap.PersentaseSubmitted != 100.0 {
		t.Fatalf("GetRecap failed: %v", err)
	}
}
