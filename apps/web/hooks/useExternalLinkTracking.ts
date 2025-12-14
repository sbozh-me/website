'use client';

import { analyticsEvents, EventCategory, EventAction } from '@/lib/analytics/events';
import { userJourney } from '@/lib/analytics/journey';

interface ExternalLinkData {
  url: string;
  label: string;
  projectId?: string;
  location?: string;
}

export function useExternalLinkTracking() {
  const trackRepositoryClick = (data: {
    repository: string;
    projectName: string;
    platform?: 'github' | 'gitlab' | 'bitbucket';
    location?: string;
  }) => {
    // Track as analytics event
    analyticsEvents.track({
      category: EventCategory.Social,
      action: EventAction.Click,
      label: 'repository_link',
      metadata: {
        repository: data.repository,
        project: data.projectName,
        platform: data.platform || 'github',
        location: data.location || 'unknown',
        timestamp: Date.now(),
      },
    });

    // Track in user journey
    userJourney.track('clicked_repository', {
      repository: data.repository,
      project: data.projectName,
      platform: data.platform,
      location: data.location,
    });

    console.log('[Analytics] Repository click tracked:', data);
  };

  const trackDiscordInviteClick = (data: {
    inviteCode?: string;
    serverName?: string;
    location?: string;
  }) => {
    // Track as analytics event
    analyticsEvents.track({
      category: EventCategory.Social,
      action: EventAction.Click,
      label: 'discord_invite',
      metadata: {
        inviteCode: data.inviteCode,
        serverName: data.serverName || 'sbozh.me',
        location: data.location || 'unknown',
        timestamp: Date.now(),
      },
    });

    // Track in user journey
    userJourney.track('clicked_discord_invite', {
      serverName: data.serverName,
      location: data.location,
    });

    console.log('[Analytics] Discord invite click tracked:', data);
  };

  const trackExternalLink = (data: ExternalLinkData) => {
    // Generic external link tracking
    analyticsEvents.track({
      category: EventCategory.Navigation,
      action: EventAction.Click,
      label: 'external_link',
      metadata: {
        url: data.url,
        label: data.label,
        projectId: data.projectId,
        location: data.location,
        timestamp: Date.now(),
      },
    });

    // Track in user journey
    userJourney.track('clicked_external_link', {
      url: data.url,
      label: data.label,
      projectId: data.projectId,
    });
  };

  return {
    trackRepositoryClick,
    trackDiscordInviteClick,
    trackExternalLink,
  };
}