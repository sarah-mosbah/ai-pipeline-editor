import axios from 'axios';
import { NodeType } from '../types/types';


/**
 * Fetch all available node types from the API
 * @returns Promise<NodeType[]> Array of node types
 * @throws Error if the request fails or the response is invalid
 */
export const fetchNodes = async (): Promise<NodeType[]> => {
  try {
    const response = await axios.get<NodeType[]>('/api/nodes');
    
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response format: expected array');
    }

    const validTypes = response.data.filter(
      (type) => type && type.id && type.name
    );

    if (validTypes.length === 0 && response.data.length > 0) {
      throw new Error('No valid node types received from API');
    }

    return validTypes;
  } catch (error: any) {
    const errorMessage =
      error?.message ||
      'Failed to load node types';
    
    throw new Error(errorMessage);
  }
};
