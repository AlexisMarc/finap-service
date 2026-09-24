import type { Transaction, User } from '@prisma/client';
import { mapTransaction, mapUser, toNumber } from './serializers.js';

describe('serializers', () => {
  it('toNumber convierte Decimal y null', () => {
    expect(toNumber('12.34')).toBe(12.34);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('mapUser excluye passwordHash y omite avatar nulo', () => {
    const user = {
      id: 'u_1',
      name: 'Marcos',
      email: 'marcos@finap.app',
      passwordHash: 'hash',
      avatarUrl: null,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    expect(mapUser(user)).toEqual({
      id: 'u_1',
      name: 'Marcos',
      email: 'marcos@finap.app',
      currency: 'USD',
    });
  });

  it('mapTransaction formatea la fecha como YYYY-MM-DD', () => {
    const transaction = {
      id: 't_1',
      userId: 'u_1',
      type: 'expense',
      amount: '86.40',
      categoryId: 'c_alim',
      date: new Date('2025-05-11'),
      note: 'Mercado Central',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Transaction;

    expect(mapTransaction(transaction)).toEqual({
      id: 't_1',
      type: 'expense',
      amount: 86.4,
      categoryId: 'c_alim',
      date: '2025-05-11',
      note: 'Mercado Central',
    });
  });
});
