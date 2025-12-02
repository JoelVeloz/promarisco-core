export interface GeofenceEventGroup {
  name: string;
  count: number;
}

export interface GeofenceZoneGroup {
  zone: string;
  count: number;
  events: GeofenceEventGroup[];
}

export interface TransformedPayload {
  UNIT?: string;
  ZONE?: string;
  POS_TIME?: string;
  POS_TIME_UTC?: string;
  SPEED?: string;
  LOCATION?: string;
}
