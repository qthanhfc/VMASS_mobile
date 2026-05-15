import { request } from './http';
import type { Message } from '../types';

/**
 * Fetch message threads from the server.
 * Falls back to an empty array when the API is unreachable so that the
 * UI can stay on the current (possibly hardcoded) dataset without crashing.
 */
export async function listMessages(channel?: string): Promise<Message[]> {
  const params = channel && channel !== 'all' ? `?channel=${encodeURIComponent(channel)}` : '';

  const raw = await request<unknown[]>({
    method: 'GET',
    path: `/messages${params}`,
  });

  if (!Array.isArray(raw)) return [];

  return raw.map((row: any) => ({
    id: Number(row.id),
    channel: row.channel ?? 'internal',
    customerId: row.customer_id ?? row.customerId,
    senderName: row.sender_name ?? row.senderName ?? '',
    preview: row.preview ?? row.last_message ?? '',
    timestamp: row.last_message_at ?? row.timestamp ?? new Date().toISOString(),
    unread: Number(row.unread_count ?? row.unread ?? 0),
    avatar: row.avatar ?? undefined,
    isPinned: Boolean(row.is_pinned ?? row.isPinned),
    replyStatus: row.reply_status ?? row.replyStatus ?? 'replied',
    customerSegment: row.customer_segment ?? row.customerSegment ?? undefined,
    customerTags: row.customer_tags ?? row.customerTags ?? [],
  }));
}

/**
 * Mark a message thread as read.
 */
export async function markMessageRead(threadId: number): Promise<void> {
  await request({ method: 'PUT', path: `/messages/${threadId}/read` });
}
