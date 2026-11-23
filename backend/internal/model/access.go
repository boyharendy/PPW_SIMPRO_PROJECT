package model

import "slices"

func (p *Publication) Author(id string) bool {
	if p.CreatedBy == id {
		return true
	}
	for _, a := range p.Authors {
		if a != nil && a.UserID == id {
			return true
		}
	}
	return false
}
func (p *Publication) Reviewer(id string) bool {
	for _, r := range p.Reviews {
		if r != nil && r.ReviewerID == id && r.Status != "DIBATALKAN" {
			return true
		}
	}
	return false
}
func (p *Publication) Visible(id string, role Role) bool {
	return role == RoleKaprodi || p.Author(id) || p.Reviewer(id) || p.VerifikatorID == id
}
func (t *TravelOrder) Participant(id string) bool {
	if t.DiajukanOleh == id {
		return true
	}
	for _, m := range t.Members {
		if m != nil && m.UserID == id {
			return true
		}
	}
	return false
}
func (t *TravelOrder) Draft() bool {
	return t.Status == TripStatusDraft || t.Status == TripStatusDraf || t.Status == TripStatusDitolak || t.Status == TripStatusPerluRevisi
}
func (t *TravelOrder) Approved() bool {
	return t.Status == TripStatusDisetujui || t.Status == TripStatusDisetujuiKaprodi
}
func (s *RpsSubmission) Reviewer(id string) bool {
	if slices.Contains(s.ReviewerIDs, id) || s.GkmReviewerID == id {
		return true
	}
	for _, r := range s.Reviews {
		if r != nil && r.ReviewerID == id && r.Status != "DIBATALKAN" {
			return true
		}
	}
	return false
}
func (c *Complaint) Assigned(id string) bool {
	for _, d := range c.Dispositions {
		if d != nil && d.KepadaPetugasID == id && d.Status == "AKTIF" {
			return true
		}
	}
	return false
}

func (p *Publication) Supervisor(id string) bool {
	for _, a := range p.Authors {
		if a != nil && a.UserID == id && a.TipePenulis == "DOSEN" && (a.Peran == "PEMBIMBING" || a.Peran == "ANGGOTA" || a.Peran == "PENULIS_PENDAMPING") {
			return true
		}
	}
	return false
}
