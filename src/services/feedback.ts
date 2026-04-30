import { request } from './http';

export type FeedbackCategory = 'feature' | 'improvement' | 'bug' | 'other';

export type FeedbackPayload = {
  category: FeedbackCategory;
  title?: string;
  content: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  source?: string;
};

type FeedbackResponse = {
  responseText?: string;
  success?: boolean;
  data?: {
    id?: number;
    created_at?: string;
  };
};

export function submitFeedback(payload: FeedbackPayload) {
  return request<FeedbackResponse>({
    method: 'POST',
    path: '/feedback',
    body: payload,
  });
}
