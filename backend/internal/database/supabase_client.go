package database

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// SupabaseClient provides a robust HTTP client to interact with Supabase PostgREST
type SupabaseClient struct {
	BaseURL    string
	ServiceKey string
	HTTPClient *http.Client
}

// NewSupabaseClient creates a new Supabase REST client
func NewSupabaseClient(baseURL, serviceKey string) *SupabaseClient {
	if baseURL == "" || serviceKey == "" {
		return nil
	}

	return &SupabaseClient{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		ServiceKey: serviceKey,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *SupabaseClient) newRequest(method, endpoint string, body io.Reader) (*http.Request, error) {
	reqURL := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, strings.TrimLeft(endpoint, "/"))
	req, err := http.NewRequest(method, reqURL, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", c.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+c.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	return req, nil
}

// Select queries a table with query parameters and decodes the result into dest
func (c *SupabaseClient) Select(table string, queryParams map[string]string, dest interface{}) error {
	v := url.Values{}
	for k, val := range queryParams {
		v.Add(k, val)
	}

	endpoint := table
	if len(v) > 0 {
		endpoint = fmt.Sprintf("%s?%s", table, v.Encode())
	}

	req, err := c.newRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal request Supabase: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("gagal membaca respon: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	if dest != nil {
		if err := json.Unmarshal(bodyBytes, dest); err != nil {
			return fmt.Errorf("gagal unmarshal respon: %w", err)
		}
	}

	return nil
}

// Insert inserts one or more records into a table
func (c *SupabaseClient) Insert(table string, data interface{}, dest interface{}) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("gagal marshal data: %w", err)
	}

	req, err := c.newRequest(http.MethodPost, table, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal request insert Supabase: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("gagal membaca respon insert: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase insert error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	if dest != nil && len(bodyBytes) > 0 {
		if err := json.Unmarshal(bodyBytes, dest); err != nil {
			return fmt.Errorf("gagal unmarshal respon insert: %w", err)
		}
	}

	return nil
}

// Update updates records matching matchParams
func (c *SupabaseClient) Update(table string, matchParams map[string]string, data interface{}, dest interface{}) error {
	v := url.Values{}
	for k, val := range matchParams {
		v.Add(k, val)
	}

	endpoint := table
	if len(v) > 0 {
		endpoint = fmt.Sprintf("%s?%s", table, v.Encode())
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("gagal marshal data update: %w", err)
	}

	req, err := c.newRequest(http.MethodPatch, endpoint, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal request update Supabase: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("gagal membaca respon update: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase update error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	if dest != nil && len(bodyBytes) > 0 {
		if err := json.Unmarshal(bodyBytes, dest); err != nil {
			return fmt.Errorf("gagal unmarshal respon update: %w", err)
		}
	}

	return nil
}

// Delete deletes records matching matchParams
func (c *SupabaseClient) Delete(table string, matchParams map[string]string) error {
	v := url.Values{}
	for k, val := range matchParams {
		v.Add(k, val)
	}

	if len(v) == 0 {
		return errors.New("delete operation requires at least one match parameter")
	}

	endpoint := fmt.Sprintf("%s?%s", table, v.Encode())
	req, err := c.newRequest(http.MethodDelete, endpoint, nil)
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal request delete Supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase delete error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// Count returns the total number of records matching queryParams using Prefer: count=exact
func (c *SupabaseClient) Count(table string, queryParams map[string]string) (int, error) {
	v := url.Values{}
	for k, val := range queryParams {
		v.Add(k, val)
	}
	v.Set("limit", "0")

	endpoint := fmt.Sprintf("%s?%s", table, v.Encode())
	req, err := c.newRequest(http.MethodHead, endpoint, nil)
	if err != nil {
		// Fallback to GET with limit=0
		req, _ = c.newRequest(http.MethodGet, endpoint, nil)
	}
	req.Header.Set("Prefer", "count=exact")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("gagal request count Supabase: %w", err)
	}
	defer resp.Body.Close()

	rangeHeader := resp.Header.Get("Content-Range")
	if rangeHeader == "" {
		return 0, nil
	}

	// Content-Range format: 0-9/100 or */100
	parts := strings.Split(rangeHeader, "/")
	if len(parts) == 2 {
		total, err := strconv.Atoi(parts[1])
		if err == nil {
			return total, nil
		}
	}

	return 0, nil
}

// RPC calls a Supabase Postgres stored function via PostgREST /rpc/<fnName>
func (c *SupabaseClient) RPC(fnName string, params interface{}, dest interface{}) error {
	payload, err := json.Marshal(params)
	if err != nil {
		return fmt.Errorf("gagal marshal params RPC: %w", err)
	}

	endpoint := fmt.Sprintf("rpc/%s", fnName)
	req, err := c.newRequest(http.MethodPost, endpoint, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal request RPC Supabase: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("gagal membaca respon RPC: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase RPC error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	if dest != nil && len(bodyBytes) > 0 {
		if err := json.Unmarshal(bodyBytes, dest); err != nil {
			return fmt.Errorf("gagal unmarshal respon RPC: %w", err)
		}
	}

	return nil
}

