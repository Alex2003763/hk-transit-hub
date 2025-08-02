
import { MtrScheduleResponse } from '../types';

const BASE_URL = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';

export const getMtrSchedule = async (line: string, station: string): Promise<MtrScheduleResponse> => {
  const response = await fetch(`${BASE_URL}?line=${line}&sta=${station}`);
  if (!response.ok) {
    throw new Error(`MTR API request failed: ${response.status} ${response.statusText}`);
  }
  const jsonResponse: MtrScheduleResponse = await response.json();
  return jsonResponse;
};
