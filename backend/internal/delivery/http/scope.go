package http

import (
	"bytes"
	"context"
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"simpro-backend/internal/database"
	"simpro-backend/internal/delivery/http/middleware"
	"simpro-backend/pkg/response"
)

// Buffer the response until the transaction commits (including deferred constraints).
type pendingResponse struct {
	gin.ResponseWriter
	body    bytes.Buffer
	status  int
	written bool
}

func (w *pendingResponse) WriteHeader(status int)      { w.status = status }
func (w *pendingResponse) Status() int                 { return w.status }
func (w *pendingResponse) Written() bool               { return w.written }
func (w *pendingResponse) WriteHeaderNow()             { w.written = true }
func (w *pendingResponse) Write(p []byte) (int, error) { w.written = true; return w.body.Write(p) }
func (w *pendingResponse) WriteString(p string) (int, error) {
	w.written = true
	return w.body.WriteString(p)
}
func (w *pendingResponse) Size() int { return w.body.Len() }
func (w *pendingResponse) Flush()    { w.WriteHeaderNow() }

type endpoint func(*RouterParams) gin.HandlerFunc

func (p *RouterParams) serve(get endpoint) gin.HandlerFunc {
	if p.Pool == nil {
		return get(p)
	}
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		tx, err := p.Pool.Begin(ctx)
		if err != nil {
			response.InternalServerError(c, "Database tidak tersedia")
			return
		}
		store := &database.TxStore{Ctx: ctx, Tx: tx}
		defer func() {
			if err := tx.Rollback(context.Background()); !errors.Is(err, pgx.ErrTxClosed) {
				store.Cleanup()
			}
		}()
		user := c.GetString(middleware.CtxUserID)
		role := "simpro_api"
		if user == "" {
			role = "simpro_public"
		} else {
			store.InternalRequest = true
		}
		if _, err = tx.Exec(ctx, "SET LOCAL ROLE "+role); err == nil {
			_, err = tx.Exec(ctx, "SELECT set_config('app.user_id',$1,true),set_config('app.active_role',$2,true),set_config('app.survey_token',$3,true)", user, string(middleware.ActiveRole(c)), c.Param("token"))
		}
		if err != nil {
			response.InternalServerError(c, "Konteks akses database gagal")
			return
		}
		if c.Request.Method != "GET" && strings.Contains(c.FullPath(), "/trips/:id") {
			// Serialize the state check and mutation across every workflow operation on this trip.
			if _, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1,0))", "trip:"+c.Param("id")); err != nil {
				response.InternalServerError(c, "Transaksi perjalanan gagal")
				return
			}
		}
		handlers := p.Bind(store)
		out := c.Writer
		w := &pendingResponse{ResponseWriter: out, status: 200}
		c.Writer = w
		defer func() { c.Writer = out }()
		get(&handlers)(c)
		c.Writer = out
		if w.status < 400 {
			if err = tx.Commit(ctx); err != nil {
				var dbErr *pgconn.PgError
				// A lost commit acknowledgement is ambiguous. Preserve the private bytes for reconciliation.
				if errors.Is(err, pgx.ErrTxCommitRollback) || errors.As(err, &dbErr) {
					store.Cleanup()
				}
				response.InternalServerError(c, "Perubahan gagal disimpan")
				return
			}
		}
		if w.status >= 500 {
			response.InternalServerError(c, "Permintaan gagal diproses")
			return
		}
		out.WriteHeader(w.status)
		_, _ = out.Write(w.body.Bytes())
	}
}
