// Import types using the correct paths from the project root
import { BaseTeam } from '../../../types/team/team';
import { Player } from '../../../types/player/player';

// Define a custom player type that includes teamId and required fields
interface TeamPlayer extends Omit<Player, 'id' | 'position' | 'name' | 'strength' | 'mood'> {
  id: string;
  position: string;
  name: string;
  strength: number;
  mood: number;
  teamId: string;
}

// Define the Team interface based on BaseTeam with our customizations
interface Team extends Omit<BaseTeam, 'players'> {
  players: TeamPlayer[];
}

type TeamUpdateData = Partial<Omit<Team, 'id' | 'players'>> & {
  formation?: string;
  players?: TeamPlayer[];
};

// Mock data - in a real app, this would be API calls
const MOCK_TEAMS: Team[] = [];
const MOCK_PLAYERS: TeamPlayer[] = [];

class TeamService {
  /**
   * Get team by ID
   * @param teamId - The ID of the team to retrieve
   * @returns The team object or null if not found
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      // In a real app, this would be an API call
      return MOCK_TEAMS.find(team => team.id === teamId) || null;
    } catch (error) {
      console.error('Error getting team by ID:', error);
      throw new Error('Failed to fetch team');
    }
  }

  /**
   * Get all players for a team
   * @param teamId - The ID of the team
   * @returns Array of players in the team
   */
  async getTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
    try {
      // In a real app, this would be an API call
      return MOCK_PLAYERS.filter(player => player.teamId === teamId);
    } catch (error) {
      console.error('Error getting team players:', error);
      throw new Error('Failed to fetch team players');
    }
  }

  /**
   * Update team information
   * @param teamId - The ID of the team to update
   * @param data - The data to update
   * @returns Boolean indicating success
   */
  async updateTeam(teamId: string, data: TeamUpdateData): Promise<boolean> {
    try {
      const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamId);
      if (teamIndex === -1) return false;
      
      // Create a new team object with the updated data
      const updatedTeam = { 
        ...MOCK_TEAMS[teamIndex], 
        ...data 
      } as Team;
      
      // Handle players update if provided
      if (data.players) {
        updatedTeam.players = data.players;
      }
      
      MOCK_TEAMS[teamIndex] = updatedTeam;
      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  }

  /**
   * Update a player's position
   * @param playerId - The ID of the player to update
   * @param position - The new position
   * @returns Boolean indicating success
   */
  async updatePlayerPosition(playerId: string, position: string): Promise<boolean> {
    try {
      // Find the player by ID
      const playerIndex = MOCK_PLAYERS.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        console.warn(`Player with ID ${playerId} not found`);
        return false;
      }
      
      // Get the player
      const player = MOCK_PLAYERS[playerIndex];
      
      // Create a new player object with the updated position
      const updatedPlayer: TeamPlayer = {
        ...player,
        position,
        teamId: player.teamId,
        id: playerId,
        name: player.name,
        strength: player.strength,
        mood: player.mood
      };
      
      // Update the player in the array
      MOCK_PLAYERS[playerIndex] = updatedPlayer;
      return true;
    } catch (error) {
      console.error('Error updating player position:', error);
      throw new Error('Failed to update player position');
    }
  }

  /**
   * Get a player by ID
   * @param playerId - The ID of the player to retrieve
   * @returns The player object or null if not found
   */
  async getPlayerById(playerId: string): Promise<TeamPlayer | null> {
    try {
      return MOCK_PLAYERS.find(player => player.id === playerId) || null;
    } catch (error) {
      console.error('Error getting player by ID:', error);
      throw new Error('Failed to fetch player');
    }
  }

  /**
   * Update a player's information
   * @param playerId - The ID of the player to update
   * @param data - The data to update
   * @returns Boolean indicating success
   */
  async updatePlayer(playerId: string, data: Partial<TeamPlayer>): Promise<boolean> {
    try {
      const playerIndex = MOCK_PLAYERS.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        console.warn(`Player with ID ${playerId} not found`);
        return false;
      }

      const updatedPlayer = {
        ...MOCK_PLAYERS[playerIndex],
        ...data,
        id: playerId // Ensure ID doesn't get overwritten
      };

      MOCK_PLAYERS[playerIndex] = updatedPlayer;
      return true;
    } catch (error) {
      console.error('Error updating player:', error);
      throw new Error('Failed to update player');
    }
  }

  /**
   * Get all teams
   * @returns Array of all teams
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      return [...MOCK_TEAMS];
    } catch (error) {
      console.error('Error getting all teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  /**
   * Create a new team
   * @param teamData - The team data
   * @returns The created team
   */
  async createTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
    try {
      const newTeam: Team = {
        ...teamData,
        id: `team-${Date.now()}`,
        players: teamData.players || []
      };
      
      MOCK_TEAMS.push(newTeam);
      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  /**
   * Delete a team
   * @param teamId - The ID of the team to delete
   * @returns Boolean indicating success
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      const index = MOCK_TEAMS.findIndex(t => t.id === teamId);
      if (index === -1) return false;
      
      MOCK_TEAMS.splice(index, 1);
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  }

  /**
   * Get available formations
   * @returns Array of available formation strings
   */
  async getAvailableFormations(): Promise<string[]> {
    return [
      '4-4-2',
      '4-3-3',
      '4-2-3-1',
      '3-5-2',
      '3-4-3',
      '5-3-2'
    ];
  }
}

export const teamService = new TeamService();

export default teamService;
