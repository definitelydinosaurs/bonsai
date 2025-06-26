import { invoke } from '@tauri-apps/api/core'

import request from '~/util/request'

export const initializeData = {
  queryKey: ['state'],
  queryFn: () => invoke('dispatch', { event: 'initialize_data' }).then(JSON.parse)
}

export const getBook = (baseUrl, isbn) => ({
  queryKey: ['book'],
  queryFn: () => request.get(`${baseUrl}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`),
  enabled: !!isbn
})

export const addBook = {
  mutationFn: book => invoke('dispatch', { event: 'add_source', payload: JSON.stringify(book) }),
}
