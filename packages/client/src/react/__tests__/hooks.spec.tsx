// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { SecureStackProvider, useQuery, useMutation } from '../index';
import { SecureStackClient } from '../../client';
import React from 'react';

// Mock SecureStackClient
const mockQuery = vi.fn();
const mockMutate = vi.fn();

vi.mock('../../client', () => {
  return {
    SecureStackClient: class {
      query = mockQuery;
      mutate = mockMutate;
      getConfig = () => ({});
    },
  };
});
describe('React Hooks', () => {
  const config = { url: 'http://test.com' };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SecureStackProvider config={config}>{children}</SecureStackProvider>
  );

  beforeEach(() => {
    mockQuery.mockReset();
    mockMutate.mockReset();
  });

  it('useQuery should fetch data', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockQuery.mockResolvedValue(mockData);

    const { result } = renderHook(() => useQuery('user.get', { id: 1 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockQuery).toHaveBeenCalledWith('user.get', { id: 1 });
  });

  it('useMutation should trigger mutation', async () => {
    const mockResponse = { success: true };
    mockMutate.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMutation('user.create'), { wrapper });

    result.current.mutate({ name: 'New User' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(mockMutate).toHaveBeenCalledWith('user.create', { name: 'New User' });
  });
});
