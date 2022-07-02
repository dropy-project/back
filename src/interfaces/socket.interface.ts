export interface SocketResponse<T> {
  status: number;
  data?: T;
  error?: string;
}

export type SocketCallback<T> = (response: SocketResponse<T>) => void;
