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

export type StepDetails = WalkDetails | BusDetails | MtrDetails;

export interface TripStep {
  type: 'walk' | 'bus' | 'mtr';
  details: StepDetails;
  summary: string;
}

export interface TripPlan {
  plan: TripStep[];
}

export interface GroundingChunk {
  web?: GroundingSource;
}

export interface GroundingSource {
    uri?: string;
    title?: string;
}