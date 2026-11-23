package usecase

import (
	"errors"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type RpsUsecase interface {
	AssignedReview(id, user string) bool
	GetSubmissions(courseID, status string) ([]*model.RpsSubmission, error)
	GetSubmissionByID(id string) (*model.RpsSubmission, error)
	CreateSubmission(userID string, sub *model.RpsSubmission) (*model.RpsSubmission, error)
	SubmitForReview(id string) error
	AssignReviewer(id string, reviewerID string) error
	ReviewSubmission(id string, reviewerID string, komentar, rekomendasi string) error
	ReviewSubmissionWithChecklist(id string, reviewerID string, komentar, rekomendasi string, items []*model.RpsReviewItem) error
	RatifySubmission(id string) error
	GetRecap() (*model.RpsRecap, error)

	// PRD Milestone 3 Methods
	AssignReviewers(id string, reviewerIDs []string) error
	UpdateReviewItems(reviewID string, items []*model.RpsReviewItem) error
	CompleteReview(reviewID string, rekomendasi, komentar string) error
	UpdateImprovementPlans(submissionID string, plans []*model.CourseImprovementPlan) error
}

type rpsUsecase struct {
	repo     repository.RpsRepository
	evalRepo repository.EvaluationRepository
}

func NewRpsUsecase(repo repository.RpsRepository, evalRepo ...repository.EvaluationRepository) RpsUsecase {
	var ev repository.EvaluationRepository
	if len(evalRepo) > 0 {
		ev = evalRepo[0]
	}
	return &rpsUsecase{repo: repo, evalRepo: ev}
}

func (u *rpsUsecase) GetSubmissions(courseID, status string) ([]*model.RpsSubmission, error) {
	return u.repo.FindAll(courseID, status)
}

func (u *rpsUsecase) GetSubmissionByID(id string) (*model.RpsSubmission, error) {
	return u.repo.FindByID(id)
}

func (u *rpsUsecase) CreateSubmission(userID string, sub *model.RpsSubmission) (*model.RpsSubmission, error) {
	if sub.CourseID == "" || sub.AcademicPeriodID == "" {
		return nil, errors.New("course_id dan academic_period_id wajib diisi")
	}
	sub.DosenPenyusunID = userID
	sub.Status = model.RpsStatusDraft

	// Auto-Forwarding: Ambil rencana perbaikan semester sebelumnya untuk mata kuliah ini
	if u.evalRepo != nil && len(sub.ImprovementPlans) == 0 {
		plans, err := u.evalRepo.FindImprovementPlansByCourse(sub.CourseID)
		if err == nil && len(plans) > 0 {
			for _, p := range plans {
				if p.Status != "SUDAH_DITERAPKAN" {
					sub.ImprovementPlans = append(sub.ImprovementPlans, p)
				}
			}
		}
	}

	return u.repo.Create(sub)
}

func (u *rpsUsecase) SubmitForReview(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.RpsStatusDraft && existing.Status != model.RpsStatusRevisi && existing.Status != model.RpsStatusPerluRevisi {
		return errors.New("hanya pengajuan berstatus DRAFT atau REVISI yang dapat diajukan")
	}
	return u.repo.UpdateStatus(id, model.RpsStatusDiajukan)
}

func (u *rpsUsecase) AssignReviewer(id string, reviewerID string) error {
	return u.AssignReviewers(id, []string{reviewerID})
}

func (u *rpsUsecase) AssignReviewers(id string, reviewerIDs []string) error {
	if len(reviewerIDs) == 0 {
		return errors.New("minimal satu reviewer_id wajib ditentukan")
	}
	return u.repo.AssignReviewers(id, reviewerIDs)
}

func (u *rpsUsecase) ReviewSubmission(id string, reviewerID string, komentar, rekomendasi string) error {
	return u.ReviewSubmissionWithChecklist(id, reviewerID, komentar, rekomendasi, nil)
}

func (u *rpsUsecase) ReviewSubmissionWithChecklist(id string, reviewerID string, komentar, rekomendasi string, items []*model.RpsReviewItem) error {
	sub, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if sub.DosenPenyusunID == reviewerID {
		return errors.New("penyusun tidak dapat menilai RPS sendiri")
	}
	for _, review := range sub.Reviews {
		if review.ReviewerID != reviewerID || review.Status != "DITUGASKAN" {
			continue
		}
		if len(items) > 0 {
			if err = u.UpdateReviewItems(review.ID, items); err != nil {
				return err
			}
		}
		return u.CompleteReview(review.ID, rekomendasi, komentar)
	}
	return errors.New("penugasan review aktif tidak ditemukan")
}

func (u *rpsUsecase) UpdateReviewItems(reviewID string, items []*model.RpsReviewItem) error {
	if len(items) == 0 {
		return errors.New("daftar item instrumen review SPMI tidak boleh kosong")
	}
	return u.repo.UpdateReviewItems(reviewID, items)
}

func (u *rpsUsecase) CompleteReview(reviewID string, rekomendasi, komentar string) error {
	if rekomendasi != "PERLU_REVISI" && rekomendasi != "DISETUJUI" && rekomendasi != "DISETUJUI_GKM" {
		return errors.New("rekomendasi review (DISETUJUI / PERLU_REVISI) wajib dipilih")
	}
	return u.repo.CompleteReview(reviewID, rekomendasi, komentar)
}

func (u *rpsUsecase) UpdateImprovementPlans(submissionID string, plans []*model.CourseImprovementPlan) error {
	return u.repo.UpdateImprovementPlans(submissionID, plans)
}

func (u *rpsUsecase) RatifySubmission(id string) error {
	existing, err := u.repo.FindByID(id)
	if err != nil {
		return err
	}
	if existing.Status != model.RpsStatusDisetujuiGKM && existing.Status != model.RpsStatusDisetujui {
		return errors.New("RPS harus disetujui GKM terlebih dahulu sebelum disahkan Kaprodi")
	}
	return u.repo.UpdateStatus(id, model.RpsStatusDisahkanKaprodi)
}

func (u *rpsUsecase) GetRecap() (*model.RpsRecap, error) {
	return u.repo.GetRecap()
}

func (u *rpsUsecase) AssignedReview(id, user string) bool { return u.repo.AssignedReview(id, user) }
