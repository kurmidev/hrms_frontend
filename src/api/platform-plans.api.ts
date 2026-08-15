import { platformClient, platformUnwrap } from './platform-client'
import type { SubscriptionPlan } from '@/types/platform.types'

export const platformPlansApi = {
  list: () =>
    platformClient
      .get<{ data: SubscriptionPlan[] }>('/platform/plans')
      .then((r) => platformUnwrap<SubscriptionPlan[]>(r)),
  create: (data: Partial<SubscriptionPlan>) =>
    platformClient
      .post<{ data: SubscriptionPlan }>('/platform/plans', data)
      .then((r) => platformUnwrap<SubscriptionPlan>(r)),
  update: (id: string, data: Partial<SubscriptionPlan>) =>
    platformClient
      .put<{ data: SubscriptionPlan }>(`/platform/plans/${id}`, data)
      .then((r) => platformUnwrap<SubscriptionPlan>(r)),
  deactivate: (id: string) => platformClient.delete(`/platform/plans/${id}`),
}
