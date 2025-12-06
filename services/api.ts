
import { Metric, Participant, EventItem, ScoreEntry, ApiResponse } from '../types';
import { MOCK_METRICS, RECENT_REGISTRATIONS, EVENTS_LIST, MOCK_SCORES, CHART_DATA } from '../constants';

// Simulator for network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  async getDashboardMetrics(): Promise<ApiResponse<Metric[]>> {
    await delay(600);
    return { data: MOCK_METRICS, status: 200 };
  }

  async getRecentRegistrations(): Promise<ApiResponse<Participant[]>> {
    await delay(800);
    return { data: RECENT_REGISTRATIONS, status: 200 };
  }

  async getChartData(): Promise<ApiResponse<any[]>> {
    await delay(500);
    return { data: CHART_DATA, status: 200 };
  }

  async getEvents(): Promise<ApiResponse<EventItem[]>> {
    await delay(400);
    return { data: EVENTS_LIST, status: 200 };
  }

  async getScores(eventId: string): Promise<ApiResponse<ScoreEntry[]>> {
    await delay(700);
    // In a real app, we would filter by eventId
    return { data: MOCK_SCORES, status: 200 };
  }

  async saveScores(eventId: string, scores: ScoreEntry[]): Promise<ApiResponse<boolean>> {
    await delay(1200);
    // Simulate validation
    if (scores.some(s => s.total > 100)) {
      throw new Error("Validation Error: Score cannot exceed 100");
    }
    return { data: true, message: "Scores saved successfully", status: 200 };
  }

  async searchParticipant(query: string): Promise<ApiResponse<Participant | null>> {
    await delay(600);
    const result = RECENT_REGISTRATIONS.find(
      p => p.chestNumber === query || p.name.toLowerCase().includes(query.toLowerCase())
    );
    return { data: result || null, status: 200 };
  }
}

export const api = new ApiService();
