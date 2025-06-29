import { invoke } from '@tauri-apps/api/core'

import request from '~/util/request'

export const initializeData = {
  queryKey: ['state'],
  queryFn: () => invoke('dispatch', { event: 'initialize_data' }).then(JSON.parse)
}

export const getBook = (baseUrl, isbn) => ({
  queryKey: ['book'],
  queryFn: () => request.get(`${baseUrl}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`),
  enabled: false
})

export const addBook = refetch => ({
  mutationFn: book => invoke('dispatch', { event: 'add_source', payload: JSON.stringify(book) }),
  onSuccess: () => refetch()
})

export const deleteBook = refetch => ({
  mutationFn: id => invoke('dispatch', { event: 'delete_source', payload: id }),
  onSuccess: () => refetch()
})
