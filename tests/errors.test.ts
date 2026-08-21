import { describe, expect, it } from 'vitest';
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  OneVizionError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '../src/utils/errors.js';

describe('Error classes', () => {
  it('should create OneVizionError', () => {
    const error = new OneVizionError('Test error', 500, { detail: 'test' }, { url: '/test' });
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.response).toEqual({ detail: 'test' });
    expect(error.request).toEqual({ url: '/test' });
    expect(error.name).toBe('OneVizionError');
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError('Auth failed', 401);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.statusCode).toBe(401);
  });

  it('should create ValidationError', () => {
    const error = new ValidationError('Validation failed', 400);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('ValidationError');
    expect(error.statusCode).toBe(400);
  });

  it('should create NetworkError', () => {
    const originalError = new Error('Network timeout');
    const error = new NetworkError('Network failed', originalError);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('NetworkError');
    expect(error.originalError).toBe(originalError);
  });

  it('should create RateLimitError', () => {
    const error = new RateLimitError('Rate limit exceeded', 60);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('RateLimitError');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError('Resource not found');
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
  });

  it('should create ServerError', () => {
    const error = new ServerError('Server error', 500);
    expect(error).toBeInstanceOf(ServerError);
    expect(error).toBeInstanceOf(OneVizionError);
    expect(error.name).toBe('ServerError');
    expect(error.statusCode).toBe(500);
  });
});
