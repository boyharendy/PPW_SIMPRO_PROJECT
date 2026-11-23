package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Store is the subset of relational operations used by SIMPRO repositories.
type Store interface {
	Select(string, map[string]string, any) error
	Count(string, map[string]string) (int, error)
	Insert(string, any, any) error
	Update(string, map[string]string, any, any) error
	Delete(string, map[string]string) error
	RPC(string, any, any) error
}

// TxStore binds all repository calls for one HTTP request to one RLS transaction.
type Querier interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}
type TxStore struct {
	Ctx             context.Context
	Tx              Querier
	InternalRequest bool
	onRollback      []func()
}

func (s *TxStore) OnRollback(f func()) { s.onRollback = append(s.onRollback, f) }
func (s *TxStore) Cleanup() {
	for _, f := range s.onRollback {
		f()
	}
	s.onRollback = nil
}
func ident(name string) string     { return pgx.Identifier{name}.Sanitize() }
func tableName(name string) string { return pgx.Identifier{"public", name}.Sanitize() }

func predicates(filters map[string]string, args *[]any) (string, error) {
	var conditions []string
	for column, filter := range filters {
		switch column {
		case "select", "order", "limit", "offset":
			continue
		case "trip_participant":
			*args = append(*args, filter)
			conditions = append(conditions, fmt.Sprintf("(diajukan_oleh=$%d::uuid OR EXISTS (SELECT FROM public.travel_members m WHERE m.travel_order_id=travel_orders.id AND m.user_id=$%d::uuid))", len(*args), len(*args)))
			continue
		case "or":
			if filter != "(status_verifikasi.eq.MENUNGGU,status.eq.MENUNGGU_VERIFIKASI)" {
				return "", errors.New("unsupported disjunction")
			}
			conditions = append(conditions, "(status_verifikasi='MENUNGGU' OR status='MENUNGGU_VERIFIKASI')")
			continue
		case "search":
			*args = append(*args, "%"+filter+"%")
			conditions = append(conditions, fmt.Sprintf("(nama_lengkap ILIKE $%d OR email ILIKE $%d)", len(*args), len(*args)))
			continue
		}
		op, value, ok := strings.Cut(filter, ".")
		if !ok {
			return "", errors.New("invalid repository filter")
		}
		switch op {
		case "eq":
			*args = append(*args, value)
			conditions = append(conditions, fmt.Sprintf("%s = $%d", ident(column), len(*args)))
		case "in":
			*args = append(*args, strings.Split(strings.Trim(value, "()"), ","))
			conditions = append(conditions, fmt.Sprintf("%s::text = ANY($%d::text[])", ident(column), len(*args)))
		default:
			return "", errors.New("unsupported repository filter")
		}
	}
	if len(conditions) == 0 {
		return "", nil
	}
	return " WHERE " + strings.Join(conditions, " AND "), nil
}

func (s *TxStore) rows(query string, args []any, dest any) error {
	var data []byte
	if err := s.Tx.QueryRow(s.Ctx, "SELECT coalesce(json_agg(r),'[]') FROM ("+query+") r", args...).Scan(&data); err != nil {
		return err
	}
	if dest == nil {
		return nil
	}
	return json.Unmarshal(data, dest)
}
func (s *TxStore) Select(table string, params map[string]string, dest any) error {
	columns := "*"
	if sel := params["select"]; sel != "" && sel != "*" {
		fields := strings.Split(sel, ",")
		for i, name := range fields {
			fields[i] = ident(name)
		}
		columns = strings.Join(fields, ",")
	}
	var args []any
	where, err := predicates(params, &args)
	if err != nil {
		return err
	}
	q := "SELECT " + columns + " FROM " + tableName(table) + where
	if order := params["order"]; order != "" {
		var fields []string
		for _, item := range strings.Split(order, ",") {
			name, dir, _ := strings.Cut(item, ".")
			if dir != "asc" && dir != "desc" {
				return errors.New("invalid repository order")
			}
			fields = append(fields, ident(name)+" "+dir)
		}
		q += " ORDER BY " + strings.Join(fields, ",")
	}
	for _, key := range []string{"limit", "offset"} {
		if raw, ok := params[key]; ok {
			n, err := strconv.Atoi(raw)
			if err != nil || n < 0 {
				return errors.New("invalid pagination")
			}
			args = append(args, n)
			q += fmt.Sprintf(" %s $%d", key, len(args))
		}
	}
	return s.rows(q, args, dest)
}
func (s *TxStore) Count(table string, params map[string]string) (int, error) {
	var args []any
	where, err := predicates(params, &args)
	if err != nil {
		return 0, err
	}
	var n int
	err = s.Tx.QueryRow(s.Ctx, "SELECT count(*) FROM "+tableName(table)+where, args...).Scan(&n)
	return n, err
}
func payloadFields(data any) ([]byte, []string, error) {
	raw, err := json.Marshal(data)
	if err != nil {
		return nil, nil, err
	}
	var obj map[string]json.RawMessage
	if err = json.Unmarshal(raw, &obj); err != nil {
		return nil, nil, err
	}
	keys := make([]string, 0, len(obj))
	for k := range obj {
		keys = append(keys, ident(k))
	}
	sort.Strings(keys)
	if len(keys) == 0 {
		return nil, nil, errors.New("empty repository payload")
	}
	return raw, keys, nil
}
func (s *TxStore) mutation(q string, args []any, dest any, requireRow bool) error {
	if dest != nil {
		var raw []byte
		if err := s.Tx.QueryRow(s.Ctx, "WITH changed AS ("+q+" RETURNING *) SELECT coalesce(json_agg(changed),'[]') FROM changed", args...).Scan(&raw); err != nil {
			return err
		}
		if requireRow && string(raw) == "[]" {
			return pgx.ErrNoRows
		}
		return json.Unmarshal(raw, dest)
	}
	tag, err := s.Tx.Exec(s.Ctx, q, args...)
	if err == nil && requireRow && tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return err
}
func (s *TxStore) Insert(table string, data, dest any) error {
	raw, keys, err := payloadFields(data)
	if err != nil {
		return err
	}
	t := tableName(table)
	cols := strings.Join(keys, ",")
	return s.mutation("INSERT INTO "+t+" ("+cols+") SELECT "+cols+" FROM jsonb_populate_record(NULL::"+t+",$1::jsonb)", []any{raw}, dest, true)
}
func (s *TxStore) Update(table string, filters map[string]string, data, dest any) error {
	raw, keys, err := payloadFields(data)
	if err != nil {
		return err
	}
	args := []any{raw}
	where, err := predicates(filters, &args)
	if err != nil || where == "" {
		return errors.New("invalid update filter")
	}
	t := tableName(table)
	cols := strings.Join(keys, ",")
	assignments := "(" + cols + ") = (SELECT " + cols + " FROM jsonb_populate_record(NULL::" + t + ",$1::jsonb))"
	return s.mutation("UPDATE "+t+" SET "+assignments+where, args, dest, true)
}
func (s *TxStore) Delete(table string, filters map[string]string) error {
	var args []any
	where, err := predicates(filters, &args)
	if err != nil || where == "" {
		return errors.New("invalid delete filter")
	}
	return s.mutation("DELETE FROM "+tableName(table)+where, args, nil, filters["id"] != "")
}
func (s *TxStore) RPC(name string, data, dest any) error {
	p, ok := data.(map[string]interface{})
	if !ok {
		return errors.New("invalid function arguments")
	}
	var arg any
	switch name {
	case "apply_rka_version":
		arg = p["p_version"]
	case "confirm_business_trip":
		arg = p["p_trip"]
	default:
		return errors.New("unknown database function")
	}
	var raw []byte
	if err := s.Tx.QueryRow(s.Ctx, "SELECT to_jsonb(app."+ident(name)+"($1::uuid))", arg).Scan(&raw); err != nil {
		return err
	}
	if dest != nil && len(raw) > 0 {
		return json.Unmarshal(raw, dest)
	}
	return nil
}
