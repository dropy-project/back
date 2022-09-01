import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import fetch from 'node-fetch';

export async function uploadContent(file: UploadedFile, Authorization: string): Promise<{ fileUrl: string }> {
  const formData = new FormData();

  formData.append('image', file.data, 'file.jpeg');

  return await fetch(`${process.env.CONTENT_URL_LOCAL}/`, {
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

export async function uploadPrivateContent(file: Buffer, Authorization: string): Promise<{ fileUrl: string; accessToken: string }> {
  const formData = new FormData();
  formData.append('image', file, 'file.jpeg');

  return await fetch(`${process.env.CONTENT_URL_LOCAL}/private`, {
    method: 'POST',
    body: formData,
    headers: { Authorization },
  }).then(response => response.json());
}
