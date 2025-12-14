export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
}

export interface TimelineGroup {
  id: string;
  label: string;
  items: TimelineItem[];
  link?: {
    href: string;
    label: string;
  };
}

export interface TimelineData {
  groups: TimelineGroup[];
}
