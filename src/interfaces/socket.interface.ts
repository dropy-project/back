export interface SocketResponse<T> {
  status: number;
  data?: T;
  energy?: number;
  error?: string;
}

export type SocketCallback<T> = (response: SocketResponse<T>) => void;
