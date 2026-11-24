import { vi, beforeEach, expect, test } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  remove: vi.fn(),
  getCsrfCookie: vi.fn(),
}))

vi.mock('../api/client', () => ({
  api: { post: mocks.post, put: mocks.put, delete: mocks.remove },
  getCsrfCookie: mocks.getCsrfCookie,
}))

import { profileApi } from '../api/profile'

beforeEach(() => {
  mocks.post.mockReset()
  mocks.put.mockReset()
  mocks.remove.mockReset()
  mocks.getCsrfCookie.mockReset()
})

test('avatar upload appends the file under the avatar FormData key', async () => {
  mocks.post.mockResolvedValue({ data: { data: { id: 1 } } })

  const file = new File(['avatar'], 'received_1213386314302650.jpeg', { type: 'image/jpeg' })
  await profileApi.uploadAvatar(file)

  expect(mocks.getCsrfCookie).toHaveBeenCalledOnce()
  expect(mocks.post).toHaveBeenCalledOnce()
  const [path, body] = mocks.post.mock.calls[0] as [string, FormData]
  expect(path).toBe('/profile/avatar')
  expect(body).toBeInstanceOf(FormData)
  expect(body.get('avatar')).toBeInstanceOf(File)
  expect((body.get('avatar') as File).name).toBe('received_1213386314302650.jpeg')
})

test('empty avatar files are rejected before submission', async () => {
  const file = new File([], 'empty.jpeg', { type: 'image/jpeg' })
  await expect(profileApi.uploadAvatar(file)).rejects.toThrow('Please choose')
  expect(mocks.post).not.toHaveBeenCalled()
})
