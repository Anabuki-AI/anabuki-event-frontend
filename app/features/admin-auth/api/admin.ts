import type { AccessRequest, ManagementAccessEntry, AdminSession } from '../types/admin'
import { request } from '~/lib/api/client'

export function getAdminSession() {
  return request<AdminSession>('/admin/auth/session')
}

export function getOwnAccessRequest() {
  return request<AccessRequest | null>('/admin/access-request')
}

export function createAccessRequest() {
  return request<AccessRequest>('/admin/access-request', { method: 'POST' })
}

export function listAccessRequests() {
  return request<AccessRequest[]>('/admin/access-requests')
}

export function decideAccessRequest(id: number, decision: 'approve' | 'reject') {
  return request<AccessRequest>(`/admin/access-requests/${id}/${decision}`, { method: 'POST' })
}

export function listAdmins() {
  return request<ManagementAccessEntry[]>('/admin/allowed-emails')
}

export function deactivateAdmin(id: number) {
  return request(`/admin/allowed-emails/${id}`, { method: 'DELETE' })
}

export function exchangeApplicantSession() {
  return request('/admin/auth/exchange', { method: 'POST' })
}

export function logoutAdmin() {
  return request('/admin/auth/logout', { method: 'POST' })
}
