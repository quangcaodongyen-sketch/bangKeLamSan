/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatementStatus = 'draft' | 'submitted' | 'archived';

export interface StatementData {
  id: string;
  statementNo: string;
  issueDate: string;
  
  // Buyer Information
  buyerName: string;
  buyerCccd: string;
  buyerAddress: string;
  buyerPhone: string;

  // Animal Information
  speciesName: string;
  scientificName: string;
  maleCount: number;
  femaleCount: number;
  unknownCount: number;
  weightPerIndividual: number; // in kg

  // Transportation Info
  vehiclePlate: string;
  fromDate: string;
  toDate: string;
  fromAddress: string;
  toAddress: string;

  // Metadata
  status: StatementStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}
