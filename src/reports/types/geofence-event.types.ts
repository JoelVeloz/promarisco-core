export interface GeofenceEventGroup {
  name: string;
  count: number;
}

export interface GeofenceZoneGroup {
  zone: string;
  count: number;
  events: GeofenceEventGroup[];
}

export interface ZoneTime {
  unit: string;
  zone: string;
  group?: string;
  entryTime: Date | null;
  exitTime: Date | null;
}
