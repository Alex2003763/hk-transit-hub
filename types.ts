export interface ApiResponse<T> {
  type: string;
  version: string;
  generated_timestamp: string;
  data: T;
}

// KMB Types
export interface Route {
  route: string;
  bound: 'O' | 'I';
  service_type: string;
  orig_tc: string;
  orig_en: string;
  orig_sc: string;
  dest_tc: string;
  dest_en: string;
  dest_sc: string;
}

export interface Stop {
  stop: string;
  name_tc: string;
  name_sc: string;
  name_en: string;
  lat: string;
  long: string;
}

export type StopInfo = Stop;

export interface RouteStop {
  route: string;
  bound: 'O' | 'I';
  service_type: string;
  seq: number;
  stop: string;
}

export interface Eta {
  co: string;
  route: string;
  dir: 'O' | 'I';
  service_type: string;
  seq: number;
  stop: string;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  eta_seq: number;
  eta: string | null;
  rmk_tc: string;
  rmk_sc: string;
  rmk_en: string;
  data_timestamp: string;
}

// MTR Types
export interface MtrTrainArrival {
  ttnt: string; // Time to next train (in minutes)
  valid: string; // "Y" or "N"
  plat: string; // Platform number
  time: string; // Arrival time "YYYY-MM-DD HH:mm:ss"
  source: string;
  dest: string; // Destination station code
  seq: string;
}

export interface MtrDirection {
  UP?: MtrTrainArrival[];
  DOWN?: MtrTrainArrival[];
}

export interface MtrData {
  curr_time: string;
  sys_time: string;
  [key: string]: MtrDirection | string; // e.g. "TKL-LHP": { UP: [...], DOWN: [...] }
}

export interface MtrScheduleResponse {
  status: number;
  message: string;
  url: string;
  isdelay: 'Y' | 'N';
  data: MtrData;
}

// AI Trip Planner Types
export interface WalkDetails {
  instruction: string;
}

export interface BusDetails {
  route: string;
  boarding_stop: string;
  alighting_stop: string;
  num_stops: number;
}

export interface MtrDetails {
  line: string;
  boarding_station: string;
  alighting_station: string;
  direction: string;
  num_stops: number;
}

export type StepDetails = WalkDetails | BusDetails | MtrDetails | MinibusDetails;

export interface TripStep {
  type: 'walk' | 'bus' | 'mtr' | 'minibus';
  details: StepDetails;
  summary: string;
  duration_minutes: number;
  cost_hkd: number;
}

export interface TripPlan {
  current_conditions?: string;
  total_time_minutes: number;
  total_cost_hkd: number;
  plan: TripStep[];
}

export interface TripResult {
  cheapest_plan: TripPlan;
  fastest_plan: TripPlan;
}

export interface GroundingChunk {
  web?: GroundingSource;
}

export interface GroundingSource {
    uri?: string;
    title?: string;
}

// Minibus Types
export interface MinibusHeadway {
  weekdays: boolean[];
  public_holiday: boolean;
  headway_seq: number;
  start_time: string;
  end_time: string;
  frequency: number;
  frequency_upper: number | null;
}

export interface MinibusDirection {
  route_seq: number;
  orig_tc: string;
  orig_sc: string;
  orig_en: string;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
  headways: MinibusHeadway[];
  data_timestamp: string;
}

export interface MinibusRoute {
  routeId: string;
  routeNo: string;
  orig_tc: string;
  orig_en: string;
  dest_tc: string;
  dest_en: string;
  serviceType: string;
  directions?: MinibusDirection[];
}

export interface MinibusStop {
  stopId: string;
  name_tc: string;
  name_en: string;
  lat: number;
  lng: number;
}

export interface MinibusEta {
  eta: string;
  remark_tc: string;
  remark_en: string;
}

export interface MinibusDetails {
  route: string;
  boarding_stop: string;
  alighting_stop: string;
  num_stops: number;
  route_zh: string;
  fare_type: 'fixed' | 'flexible';
  peak_hour_warning: boolean;
  is_gmb: boolean;
}

export type ActiveTab = 'planner' | 'kmb' | 'mtr' | 'settings' | 'minibus';
export type Theme = 'light' | 'dark';