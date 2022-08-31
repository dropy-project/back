import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import fetch from 'node-fetch';

const CONTENT_SERVER_URL = 'http://localhost:6000';

export async function uploadContent(file: UploadedFile, Authorization: string): Promise<{ fileUrl: string }> {
  const formData = new FormData();

  formData.append('image', file.data, file.name);

  return await fetch(`${CONTENT_SERVER_URL}/`, {
    method: 'POST',
    body: formData,
    headers: { Authorization },
  }).then(response => response.json());
}

export async function deleteContent(fileUrl: string, Authorization: string) {
  await fetch(fileUrl, {
    method: 'DELETE',
    headers: { Authorization },
  });
}

export async function uploadPrivateContent(file: UploadedFile, Authorization: string): Promise<{ fileUrl: string; accessToken: string }> {
  const formData = new FormData();
  formData.append('image', file.data, file.name);

  return await fetch(`${CONTENT_SERVER_URL}/private`, {
    method: 'POST',
    body: formData,
    headers: { Authorization },
  }).then(response => response.json());
}
