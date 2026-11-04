package scheduler

import (
	"log"
	"sync"
	"time"

	"simpro-backend/internal/model"
	"simpro-backend/internal/repository"
)

type Scheduler interface {
	Start()
	Stop()
	RunAllJobs() map[string]int
}

type simproScheduler struct {
	surveyRepo    repository.SurveyRepository
	pubRepo       repository.PublicationRepository
	tripRepo      repository.TripRepository
	rkaRepo       repository.RkaRepository
	rpsRepo       repository.RpsRepository
	evalRepo      repository.EvaluationRepository
	complaintRepo repository.ComplaintRepository
	adminRepo     repository.AdminRepository

	stopChan chan struct{}
	wg       sync.WaitGroup
	running  bool
	mu       sync.Mutex
}

func NewScheduler(
	surveyRepo repository.SurveyRepository,
	pubRepo repository.PublicationRepository,
	tripRepo repository.TripRepository,
	rkaRepo repository.RkaRepository,
	rpsRepo repository.RpsRepository,
	evalRepo repository.EvaluationRepository,
	complaintRepo repository.ComplaintRepository,
	adminRepo repository.AdminRepository,
) Scheduler {
	return &simproScheduler{
		surveyRepo:    surveyRepo,
		pubRepo:       pubRepo,
		tripRepo:      tripRepo,
		rkaRepo:       rkaRepo,
		rpsRepo:       rpsRepo,
		evalRepo:      evalRepo,
		complaintRepo: complaintRepo,
		adminRepo:     adminRepo,
		stopChan:      make(chan struct{}),
	}
}

func (s *simproScheduler) Start() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		log.Println("⏰ [Scheduler] SIMPRO 07:00 WIB Background Cron Runner aktif")

		// Check every minute if local time is 07:00 WIB (00:00 UTC)
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		var lastRunDate string

		for {
			select {
			case <-s.stopChan:
				log.Println("🛑 [Scheduler] Cron Runner dihentikan")
				return
			case now := <-ticker.C:
				wibLocation := time.FixedZone("WIB", 7*3600)
				nowWib := now.In(wibLocation)

				// Run once per day at 07:00 WIB
				if nowWib.Hour() == 7 && nowWib.Minute() == 0 {
					todayStr := nowWib.Format("2006-01-02")
					if lastRunDate != todayStr {
						lastRunDate = todayStr
						log.Printf("🚀 [Scheduler] Menjalankan batch harian 07:00 WIB (%s)...", todayStr)
						results := s.RunAllJobs()
						log.Printf("✅ [Scheduler] Batch harian selesai dieksekusi: %+v", results)
					}
				}
			}
		}
	}()
}

func (s *simproScheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.running {
		return
	}
	close(s.stopChan)
	s.running = false
	s.wg.Wait()
}

func (s *simproScheduler) RunAllJobs() map[string]int {
	results := make(map[string]int)

	results["expire_invitations"] = s.jobExpireInvitations()
	results["remind_invitations"] = s.jobRemindInvitations()
	results["remind_trip_reports"] = s.jobRemindTripReports()
	results["remind_rps_reviews"] = s.jobRemindRpsReviews()
	results["remind_evaluations"] = s.jobRemindEvaluations()
	results["remind_verifications"] = s.jobRemindVerifications()
	results["escalate_complaints"] = s.jobEscalateComplaints()
	results["autoclose_complaints"] = s.jobAutocloseComplaints()

	return results
}

// 1. expire_invitations: Menonaktifkan token survei yang melewati batas 30 hari (status KEDALUWARSA)
func (s *simproScheduler) jobExpireInvitations() int {
	invs, err := s.surveyRepo.FindInvitations()
	if err != nil {
		return 0
	}
	count := 0
	now := time.Now()
	for _, inv := range invs {
		if inv.Status == "TERKIRIM" && !inv.IsCompleted {
			if inv.ExpiredAt != nil && now.After(*inv.ExpiredAt) {
				_ = s.surveyRepo.UpdateInvitationStatus(inv.ID, "KEDALUWARSA")
				count++
			} else if now.Sub(inv.CreatedAt) > 30*24*time.Hour {
				_ = s.surveyRepo.UpdateInvitationStatus(inv.ID, "KEDALUWARSA")
				count++
			}
		}
	}
	return count
}

// 2. remind_invitations: Pengingat survei belum diisi
func (s *simproScheduler) jobRemindInvitations() int {
	invs, err := s.surveyRepo.FindInvitations()
	if err != nil {
		return 0
	}
	count := 0
	now := time.Now()
	for _, inv := range invs {
		if inv.Status == "TERKIRIM" && !inv.IsCompleted {
			if now.Sub(inv.CreatedAt) >= 7*24*time.Hour {
				count++
			}
		}
	}
	return count
}

// 3. remind_trip_reports: Pengingat unggah SPJ dinas pada H+3 dan H+7
func (s *simproScheduler) jobRemindTripReports() int {
	trips, _, err := s.tripRepo.FindAll("", "", "", 0, 1000, 0)
	if err != nil {
		return 0
	}
	count := 0
	now := time.Now()
	for _, trip := range trips {
		if trip.Status == model.TripStatusDisetujui {
			if tKembali, err := time.Parse("2006-01-02", trip.TanggalKembali); err == nil {
				days := int(now.Sub(tKembali).Hours() / 24)
				if days >= 3 {
					count++
				}
			}
		}
	}
	return count
}

// 4. remind_rps_reviews: Pengingat batas waktu review RPS
func (s *simproScheduler) jobRemindRpsReviews() int {
	subs, _, err := s.rpsRepo.FindSubmissions("", "", 1000, 0)
	if err != nil {
		return 0
	}
	count := 0
	for _, sub := range subs {
		if sub.Status == model.RpsStatusDiajukan {
			count++
		}
	}
	return count
}

// 5. remind_evaluations: Pengingat pengisian evaluasi perkuliahan
func (s *simproScheduler) jobRemindEvaluations() int {
	evals, err := s.evalRepo.FindAll()
	if err != nil {
		return 0
	}
	count := 0
	for _, eval := range evals {
		if !eval.IsSubmitted {
			count++
		}
	}
	return count
}

// 6. remind_verifications: Pengingat antrean verifikasi publikasi
func (s *simproScheduler) jobRemindVerifications() int {
	queue, err := s.pubRepo.GetVerificationQueue("")
	if err != nil {
		return 0
	}
	return len(queue)
}

// 7. escalate_complaints: Eskalasi aduan melewati SLA 5 hari kerja ke Kaprodi
func (s *simproScheduler) jobEscalateComplaints() int {
	complaints, _, err := s.complaintRepo.FindAll("", "", nil, 1000, 0)
	if err != nil {
		return 0
	}
	count := 0
	now := time.Now()
	for _, c := range complaints {
		if (c.Status == model.ComplaintStatusDiterima || c.Status == model.ComplaintStatusDidisposisikan) && !c.IsEscalatedKaprodi {
			tgl := c.TanggalDiterima
			if tgl == "" {
				tgl = c.TanggalPengaduan
			}
			if t, err := time.Parse("2006-01-02", tgl); err == nil {
				if now.Sub(t) >= 5*24*time.Hour {
					c.IsEscalatedKaprodi = true
					tNow := time.Now()
					c.EscalatedAt = &tNow
					count++
				}
			}
		}
	}
	return count
}

// 8. autoclose_complaints: Penutupan tiket aduan SELESAI tanpa respon setelah 14 hari
func (s *simproScheduler) jobAutocloseComplaints() int {
	complaints, _, err := s.complaintRepo.FindAll("", string(model.ComplaintStatusSelesai), nil, 1000, 0)
	if err != nil {
		return 0
	}
	count := 0
	now := time.Now()
	for _, c := range complaints {
		tgl := c.TanggalSelesai
		if tgl == "" && c.TanggalPenyelesaian != nil {
			tgl = *c.TanggalPenyelesaian
		}
		if tgl != "" {
			if t, err := time.Parse("2006-01-02", tgl); err == nil {
				if now.Sub(t) >= 14*24*time.Hour {
					_ = s.complaintRepo.Close(c.ID, "SISTEM_CRON", "Ditutup otomatis oleh sistem setelah 14 hari status SELESAI tanpa sanggahan pelapor")
					count++
				}
			}
		}
	}
	return count
}

