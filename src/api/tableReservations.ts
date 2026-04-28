import apiClient from './client';
import { TableReservation } from '../types';

export interface CreateTableReservationInput {
  eventId: string;
  partySize: number;
  tableFee: number;
}

export const getTableReservations = async (eventId?: string): Promise<TableReservation[]> => {
  const response = await apiClient.get<{ reservations: TableReservation[] }>('/table-reservations', {
    params: eventId ? { eventId } : undefined,
  });
  return response.data.reservations ?? [];
};

export const createTableReservation = async (input: CreateTableReservationInput): Promise<TableReservation> => {
  const response = await apiClient.post<{ reservation: TableReservation }>('/table-reservations', input);
  return response.data.reservation;
};

export const splitAndPayTableReservation = async (id: string): Promise<TableReservation> => {
  const response = await apiClient.post<{ reservation: TableReservation }>(`/table-reservations/${id}/split-pay`);
  return response.data.reservation;
};
